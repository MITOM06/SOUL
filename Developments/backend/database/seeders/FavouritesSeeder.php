<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Favourite;

/**
 * Seed the favourites table.  Favourites map users to products they like.
 */
class FavouritesSeeder extends Seeder
{
    public function run()
    {
        // Populate favourites to simulate users bookmarking products they like.
        $userIds    = \App\Models\User::where('role', '!=', 'admin')->pluck('id')->all();
        $productIds = \App\Models\Product::pluck('id')->all();
        if (empty($userIds) || empty($productIds)) return;

        $pairs = [];
        // Target roughly 1,000 favourite entries or as many unique
        // user/product combinations as possible.
        $target = min(1000, count($userIds) * count($productIds));
        for ($i = 0; $i < $target; $i++) {
            $uid = $userIds[array_rand($userIds)];
            $pid = $productIds[array_rand($productIds)];
            $key = $uid . '-' . $pid;
            if (isset($pairs[$key])) continue; // avoid duplicate favourites
            $pairs[$key] = true;
            \App\Models\Favourite::create([
                'user_id'    => $uid,
                'product_id' => $pid,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}