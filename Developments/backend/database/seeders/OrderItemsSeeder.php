<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Arr;

/**
 * Seed the order_items table.  Order items link products to orders and
 * include a unit price and quantity.  The factory handles the creation
 * of associated orders and products when needed.
 */
class OrderItemsSeeder extends Seeder
{
    public function run()
    {
        $orderIds = Order::pluck('id')->toArray();
        $productIds = Product::pluck('id')->toArray();
        OrderItem::factory()
            ->count(30)
            ->state(function () use ($orderIds, $productIds) {
                return [
                    'order_id'   => Arr::random($orderIds),
                    'product_id' => Arr::random($productIds),
                ];
            })
            ->create();
    }
}
