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
use Carbon\Carbon;

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
        // Use Carbon for deterministic date generation
        $startDate = Carbon::create(2024, 1, 1, 0, 0, 0);
        $endDate   = Carbon::now();

        // Capture the seeder instance for use inside the closure.  This avoids
        // relying on PHP's automatic binding of $this within anonymous functions.
        $seederInstance = $this;
        DB::transaction(function () use ($userIds, $productIds, $providers, $startDate, $endDate, $seederInstance) {
            // Create a varied number of orders for every user (excluding admins).  Each
            // user will have between 2 and 5 orders to exercise different
            // combinations of products and statuses.  This loop ensures broad
            // coverage of user/product permutations without creating an
            // impractically large data set.
            foreach ($userIds as $uid) {
                $orderCount = random_int(2, 5);
                for ($i = 0; $i < $orderCount; $i++) {
                    // Generate a random timestamp for the order within the allowed range
                    $orderDate = $seederInstance->randomDateBetween($startDate, $endDate);
                    $order = Order::create([
                        'user_id'        => $uid,
                        'total_cents'    => 0,
                        'status'         => 'pending',
                        'payment_method' => $providers[array_rand($providers)],
                        'created_at'     => $orderDate,
                        'updated_at'     => $orderDate,
                    ]);

                    // For each order, choose 1..5 items.  Ensure we always pick
                    // distinct products to avoid duplicate order_item rows.
                    $itemsInOrder = random_int(1, 5);
                    $picked       = collect($productIds)->shuffle()->take($itemsInOrder)->all();
                    $total        = 0;
                    foreach ($picked as $pid) {
                        $qty   = random_int(1, 3);
                        $price = (int) (DB::table('products')->where('id', $pid)->value('price_cents') ?? random_int(1000, 20000));
                        $total += $price * $qty;
                        OrderItem::create([
                            'order_id'         => $order->id,
                            'product_id'       => $pid,
                            'unit_price_cents' => $price,
                            'quantity'         => $qty,
                            'created_at'       => $orderDate,
                            'updated_at'       => $orderDate,
                        ]);
                    }

                    // Determine payment status: 80% paid, 10% pending, 10% cancelled
                    $roll   = random_int(1, 100);
                    if ($roll <= 80) {
                        $status = 'paid';
                    } elseif ($roll <= 90) {
                        $status = 'pending';
                    } else {
                        $status = 'cancelled';
                    }
                    $order->update([
                        'total_cents' => $total,
                        'status'      => $status,
                    ]);

                    // Create payment record for paid orders.  Use the order's
                    // timestamp to align payment creation with order creation.
                    if ($status === 'paid') {
                        Payment::create([
                            'order_id'     => $order->id,
                            'user_id'      => $uid,
                            'provider'     => $providers[array_rand($providers)],
                            'amount_cents' => $total,
                            'currency'     => 'USD',
                            'status'       => Payment::STATUS_SUCCESS,
                            'provider_payment_id' => (string) Str::uuid(),
                            'raw_response' => ['seed' => true],
                            'created_at'   => $orderDate,
                            'updated_at'   => $orderDate,
                        ]);
                    }
                }
            }
        });
    }

    /**
     * Generate a random Carbon instance between two dates.  This helper
     * encapsulates the common logic used throughout this seeder for
     * timestamp assignment.
     */
    private function randomDateBetween(Carbon $start, Carbon $end): Carbon
    {
        $min = $start->getTimestamp();
        $max = $end->getTimestamp();
        $ts  = random_int($min, $max);
        return Carbon::createFromTimestamp($ts);
    }
}
