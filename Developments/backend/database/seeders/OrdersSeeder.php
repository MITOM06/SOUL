<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;

/**
 * Seed the orders table.  Each order belongs to a user and includes a total
 * amount, status and payment method.  Related users will be generated on
 * demand if they do not already exist.
 */
class OrdersSeeder extends Seeder
{
    public function run()
    {
        Order::factory()->count(30)->create();
    }
}