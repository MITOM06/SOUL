<?php
namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $r)
    {
        $months = (int) ($r->query('months', 6));
        if (!in_array($months, [1,3,6], true)) $months = 6;

        $start = now()->subMonths($months)->startOfDay();

        // Totals
        $users    = (int) DB::table('users')->count();
        $products = (int) DB::table('products')->count();
        $ordersPaid = (int) DB::table('orders')->where('status','paid')->count();
        $revenueCents = (int) DB::table('orders')->where('status','paid')->sum('total_cents');

        // Daily revenue and orders within timeframe
        $rows = DB::table('orders')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as orders, SUM(total_cents) as revenue_cents')
            ->where('status','paid')
            ->where('created_at','>=',$start)
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        // Normalize to all days
        $labels = [];
        $ordersSeries = [];
        $revenueSeries = [];
        $map = [];
        foreach ($rows as $row) { $map[$row->d] = $row; }
        $cursor = (clone $start);
        $end = now();
        while ($cursor <= $end) {
            $key = $cursor->toDateString();
            $labels[] = $key;
            $ordersSeries[] = isset($map[$key]) ? (int)$map[$key]->orders : 0;
            $revenueSeries[] = isset($map[$key]) ? (int)$map[$key]->revenue_cents : 0;
            $cursor->addDay();
        }

        // Plan mix (active subscriptions)
        $plans = DB::table('user_subscriptions')
            ->selectRaw('plan_key, COUNT(*) as c')
            ->where('status','active')
            ->groupBy('plan_key')
            ->pluck('c','plan_key');
        $planLabels = ['basic','premium','vip'];
        $planValues = array_map(fn($k) => (int)($plans[$k] ?? 0), $planLabels);

        // Product type mix
        $types = DB::table('products')->selectRaw('type, COUNT(*) as c')->groupBy('type')->pluck('c','type');
        $typeLabels = ['ebook','podcast'];
        $typeValues = array_map(fn($k) => (int)($types[$k] ?? 0), $typeLabels);

        return response()->json([
            'success' => true,
            'data' => [
                'totals' => [
                    'users' => $users,
                    'products' => $products,
                    'orders_paid' => $ordersPaid,
                    'revenue_cents' => $revenueCents,
                ],
                'timeframe' => [ 'months' => $months ],
                'series' => [
                    'daily' => [
                        'labels' => $labels,
                        'orders' => $ordersSeries,
                        'revenue_cents' => $revenueSeries,
                    ],
                ],
                'pies' => [
                    'plans' => [ 'labels' => $planLabels, 'values' => $planValues ],
                    'products' => [ 'labels' => $typeLabels, 'values' => $typeValues ],
                ],
            ],
        ]);
    }
}
