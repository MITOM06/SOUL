<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * GET /api/v1/admin/reports/income
     * Query (mode=day):   from=YYYY-MM-DD, to=YYYY-MM-DD   (min 14 days, max ~92 days)
     * Query (mode=month): from_month=YYYY-MM, to_month=YYYY-MM (min 1 month, max 6 months)
     * Returns labels + revenue series for the chosen mode, plus summary totals for the range.
     */
    public function income(Request $r)
    {
        $mode = $r->query('mode', 'day'); // 'day' | 'month'
        if (!in_array($mode, ['day','month'], true)) $mode = 'day';

        if ($mode === 'month') {
            $fromM = $r->query('from_month');
            $toM   = $r->query('to_month');
            if (!$fromM || !$toM) {
                return response()->json(['success'=>false,'message'=>'from_month and to_month are required'], 422);
            }
            try {
                $start = Carbon::createFromFormat('Y-m', $fromM)->startOfMonth();
                $end   = Carbon::createFromFormat('Y-m', $toM)->endOfMonth();
            } catch (\Throwable $e) {
                return response()->json(['success'=>false,'message'=>'Invalid month format (Y-m)'], 422);
            }
            if ($start->gt($end)) [$start, $end] = [$end, $start];
            $diffMonths = $start->diffInMonths($end) + 1;
            if ($diffMonths < 1 || $diffMonths > 6) {
                return response()->json(['success'=>false,'message'=>'Month range must be between 1 and 6 months'], 422);
            }

            // Aggregate paid order revenue by month
            $rows = DB::table('orders')
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, SUM(total_cents) as revenue_cents")
                ->where('status','paid')
                ->whereBetween('created_at', [$start, $end])
                ->groupBy('ym')
                ->orderBy('ym')
                ->get();
            $map = [];
            foreach ($rows as $row) $map[$row->ym] = (int)$row->revenue_cents;

            $labels = [];
            $values = [];
            $cursor = (clone $start)->startOfMonth();
            while ($cursor <= $end) {
                $key = $cursor->format('Y-m');
                $labels[] = $key;
                $values[] = (int)($map[$key] ?? 0);
                $cursor->addMonth();
            }

            // Totals for the period
            $totalOrders = (int) DB::table('orders')->where('status','paid')->whereBetween('created_at', [$start, $end])->count();
            $totalSubs   = (int) DB::table('user_subscriptions')->whereBetween('created_at', [$start, $end])->count();
            $totalProducts= (int) DB::table('products')->whereBetween('created_at', [$start, $end])->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'mode' => 'month',
                    'labels' => $labels,
                    'revenue_cents' => $values,
                    'summary' => [
                        'orders'   => $totalOrders,
                        'subs'     => $totalSubs,
                        'products' => $totalProducts,
                    ],
                ],
            ]);
        }

        // mode === 'day'
        $from = $r->query('from');
        $to   = $r->query('to');
        if (!$from || !$to) {
            return response()->json(['success'=>false,'message'=>'from and to are required'], 422);
        }
        try {
            $start = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
            $end   = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();
        } catch (\Throwable $e) {
            return response()->json(['success'=>false,'message'=>'Invalid date format (Y-m-d)'], 422);
        }
        if ($start->gt($end)) [$start, $end] = [$end, $start];
        $days = $start->diffInDays($end) + 1;
        if ($days < 14 || $days > 92) {
            return response()->json(['success'=>false,'message'=>'Day range must be between 14 days and 3 months'], 422);
        }

        $rows = DB::table('orders')
            ->selectRaw('DATE(created_at) as d, SUM(total_cents) as revenue_cents')
            ->where('status','paid')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('d')
            ->orderBy('d')
            ->get();
        $map = [];
        foreach ($rows as $row) $map[$row->d] = (int)$row->revenue_cents;

        $labels = [];
        $values = [];
        $cursor = (clone $start);
        while ($cursor <= $end) {
            $key = $cursor->toDateString();
            $labels[] = $key;
            $values[] = (int)($map[$key] ?? 0);
            $cursor->addDay();
        }

        $totalOrders = (int) DB::table('orders')->where('status','paid')->whereBetween('created_at', [$start, $end])->count();
        $totalSubs   = (int) DB::table('user_subscriptions')->whereBetween('created_at', [$start, $end])->count();
        $totalProducts= (int) DB::table('products')->whereBetween('created_at', [$start, $end])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'mode' => 'day',
                'labels' => $labels,
                'revenue_cents' => $values,
                'summary' => [
                    'orders'   => $totalOrders,
                    'subs'     => $totalSubs,
                    'products' => $totalProducts,
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/reports/daily
     * Returns daily metrics for orders/subscriptions/products counts in a day range.
     * Query: from=YYYY-MM-DD, to=YYYY-MM-DD (min 14 days, max 3 months)
     */
    public function daily(Request $r)
    {
        $from = $r->query('from');
        $to   = $r->query('to');
        if (!$from || !$to) return response()->json(['success'=>false,'message'=>'from and to are required'], 422);
        try {
            $start = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
            $end   = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();
        } catch (\Throwable $e) {
            return response()->json(['success'=>false,'message'=>'Invalid date format (Y-m-d)'], 422);
        }
        if ($start->gt($end)) [$start, $end] = [$end, $start];
        $days = $start->diffInDays($end) + 1;
        if ($days < 14 || $days > 92) {
            return response()->json(['success'=>false,'message'=>'Day range must be between 14 days and 3 months'], 422);
        }

        // Orders per day (paid)
        $rowsOrders = DB::table('orders')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->where('status','paid')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('d')->orderBy('d')->get();
        $mapOrders = [];
        foreach ($rowsOrders as $r1) $mapOrders[$r1->d] = (int)$r1->c;

        // Subscriptions per day (any status; could filter 'active' only)
        $rowsSubs = DB::table('user_subscriptions')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('d')->orderBy('d')->get();
        $mapSubs = [];
        foreach ($rowsSubs as $r2) $mapSubs[$r2->d] = (int)$r2->c;

        // Products created per day
        $rowsProducts = DB::table('products')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('d')->orderBy('d')->get();
        $mapProducts = [];
        foreach ($rowsProducts as $r3) $mapProducts[$r3->d] = (int)$r3->c;

        $labels = [];
        $orders = [];
        $subs = [];
        $products = [];
        $cursor = (clone $start);
        while ($cursor <= $end) {
            $key = $cursor->toDateString();
            $labels[] = $key;
            $orders[] = (int)($mapOrders[$key] ?? 0);
            $subs[] = (int)($mapSubs[$key] ?? 0);
            $products[] = (int)($mapProducts[$key] ?? 0);
            $cursor->addDay();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'labels' => $labels,
                'orders' => $orders,
                'subscriptions' => $subs,
                'products' => $products,
            ],
        ]);
    }
}

