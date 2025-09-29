<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Date;

class PlanInclusions
{
    /**
     * Return included product ID arrays for a plan.
     * @return array{ebooks: int[], podcasts: int[]}
     */
    public static function includedIds(string $planKey): array
    {
        $planKey = strtolower($planKey);
        $ebookLimit   = $planKey === 'vip' ? 10 : 5;
        $podcastLimit = $planKey === 'vip' ? 10 : 5;

        // pick latest paid items, active only
        $ebooks = DB::table('products')
            ->where('is_active', 1)
            ->where('type', 'ebook')
            ->where('price_cents', '>', 0)
            ->orderByDesc('id')
            ->limit($ebookLimit)
            ->pluck('id')
            ->toArray();

        $podcasts = DB::table('products')
            ->where('is_active', 1)
            ->where('type', 'podcast')
            ->where('price_cents', '>', 0)
            ->orderByDesc('id')
            ->limit($podcastLimit)
            ->pluck('id')
            ->toArray();

        if ($planKey === 'vip') {
            // Ensure VIP also contains everything from Premium (5+5). We already selected 10+10 latest,
            // which likely includes the 5+5, but explicitly merge with the premium picks to be safe.
            $prem = self::includedIds('premium');
            $ebooks   = array_values(array_unique(array_merge($prem['ebooks'],   $ebooks)));
            $podcasts = array_values(array_unique(array_merge($prem['podcasts'], $podcasts)));
        }

        return [ 'ebooks' => $ebooks, 'podcasts' => $podcasts ];
    }

    /**
     * Return product rows for plan inclusions.
     */
    public static function includedProducts(string $planKey): array
    {
        $ids = self::includedIds($planKey);
        $selectCols = [
            'id','type','title','description','price_cents','thumbnail_url','category','slug','created_at','updated_at'
        ];
        $ebooks = [];
        $podcasts = [];
        if ($ids['ebooks']) {
            $ebooks = DB::table('products')->whereIn('id', $ids['ebooks'])->orderByDesc('id')->get($selectCols)->toArray();
        }
        if ($ids['podcasts']) {
            $podcasts = DB::table('products')->whereIn('id', $ids['podcasts'])->orderByDesc('id')->get($selectCols)->toArray();
        }
        return [ 'ebooks' => $ebooks, 'podcasts' => $podcasts ];
    }

    /**
     * Grant included products to user's library by creating a paid order with zero totals.
     * Returns created order ID or null if nothing to grant.
     */
    public static function grantToUser(int $userId, string $planKey): ?int
    {
        $ids = self::includedIds($planKey);
        $allIds = array_values(array_unique(array_merge($ids['ebooks'], $ids['podcasts'])));
        if (empty($allIds)) return null;

        // Filter out products already purchased by the user
        $purchased = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('o.user_id', $userId)
            ->where('o.status', 'paid')
            ->whereIn('oi.product_id', $allIds)
            ->pluck('oi.product_id')->toArray();

        $toGrant = array_values(array_diff($allIds, $purchased));
        if (empty($toGrant)) return null;

        return DB::transaction(function () use ($userId, $toGrant) {
            $orderId = DB::table('orders')->insertGetId([
                'user_id'        => $userId,
                'total_cents'    => 0,
                'status'         => 'paid',
                'payment_method' => 'subscription',
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            $rows = [];
            foreach ($toGrant as $pid) {
                $rows[] = [
                    'order_id'         => $orderId,
                    'product_id'       => $pid,
                    'unit_price_cents' => 0,
                    'quantity'         => 1,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }
            if (!empty($rows)) {
                DB::table('order_items')->insert($rows);
            }
            return $orderId;
        });
    }

    /**
     * Check if a product is included in user's active subscription.
     */
    public static function userHasAccessViaPlan(int $userId, int $productId): bool
    {
        // Find active subscription
        $sub = DB::table('user_subscriptions')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderByDesc('id')
            ->first();
        if (!$sub) return false;
        if ($sub->end_date && now()->gt($sub->end_date)) return false;
        $plan = strtolower($sub->plan_key ?? '');
        if (!in_array($plan, ['premium','vip'], true)) return false;

        $ids = self::includedIds($plan);
        return in_array($productId, $ids['ebooks'], true) || in_array($productId, $ids['podcasts'], true);
    }
}

