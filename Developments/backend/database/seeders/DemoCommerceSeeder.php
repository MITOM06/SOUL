<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Str;

/**
 * Seed orders, order items and payments coherently so that:
 *  - Many users have multiple orders
 *  - A good portion of orders are paid with matching payment records
 *  - Totals are consistent (sum of items)
 */
class DemoCommerceSeeder extends Seeder
{
    public function run()
    {
        $userIds = User::where('role', '!=', 'admin')->pluck('id')->all();
        $productIds = Product::pluck('id')->all();
        if (empty($userIds) || empty($productIds)) return;

        $providers = ['stripe','paypal','card','momo'];
        $now = now();

        DB::transaction(function () use ($userIds, $productIds, $providers, $now) {
            // create 1..3 orders for ~160 users
            $sampleUsers = collect($userIds)->shuffle()->take(min(160, count($userIds)));
            foreach ($sampleUsers as $uid) {
                $orderCount = random_int(1, 3);
                for ($i=0; $i<$orderCount; $i++) {
                    $order = Order::create([
                        'user_id'        => $uid,
                        'total_cents'    => 0,
                        'status'         => 'pending',
                        'payment_method' => $providers[array_rand($providers)],
                        'created_at'     => $now->copy()->subDays(random_int(0, 120)),
                        'updated_at'     => $now,
                    ]);

                    // 1..4 items per order
                    $itemsInOrder = random_int(1, 4);
                    $picked = collect($productIds)->shuffle()->take($itemsInOrder)->all();
                    $total = 0;
                    foreach ($picked as $pid) {
                        $qty = random_int(1, 3);
                        // seed price from product or random fallback
                        $price = (int) (DB::table('products')->where('id', $pid)->value('price_cents') ?? random_int(1000, 20000));
                        $total += $price * $qty;
                        OrderItem::create([
                            'order_id'          => $order->id,
                            'product_id'        => $pid,
                            'unit_price_cents'  => $price,
                            'quantity'          => $qty,
                            'created_at'        => $now,
                            'updated_at'        => $now,
                        ]);
                    }

                    // Decide status
                    $paid = random_int(1, 100) <= 70; // 70% paid
                    $status = $paid ? 'paid' : (random_int(0,1) ? 'pending' : 'cancelled');
                    $order->update(['total_cents' => $total, 'status' => $status]);

                    if ($paid) {
                        Payment::create([
                            'order_id'     => $order->id,
                            'user_id'      => $order->user_id,
                            'provider'     => $providers[array_rand($providers)],
                            'amount_cents' => $total,
                            'currency'     => 'USD',
                            'status'       => Payment::STATUS_SUCCESS,
                            'provider_payment_id' => (string) Str::uuid(),
                            'raw_response' => ['seed' => true],
                            'created_at'   => $now,
                            'updated_at'   => $now,
                        ]);
                    }
                }
            }
        });
    }
}
