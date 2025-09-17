<?php

namespace Database\Seeders;
use Illuminate\Support\Arr;
use App\Models\User;

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
        $userIds = User::pluck('id')->toArray();
Order::factory()
    ->count(30)
    ->state(function () use ($userIds) {
        return ['user_id' => Arr::random($userIds)];
    })
    ->create();

    }
}