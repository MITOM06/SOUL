<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderItem;

/**
 * Seed the order_items table.  Order items link products to orders and
 * include a unit price and quantity.  The factory handles the creation
 * of associated orders and products when needed.
 */
class OrderItemsSeeder extends Seeder
{
    public function run()
    {
        OrderItem::factory()->count(30)->create();
    }
}