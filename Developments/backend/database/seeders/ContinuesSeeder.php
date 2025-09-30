<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Continues;

/**
 * Seed the continues table.  Continues track user progress through ebooks
 * or podcasts.  Each record is created via the ContinuesFactory.
 */
class ContinuesSeeder extends Seeder
{
    public function run()
    {
        // Seed progress tracking for a variety of users and products.  Each
        // record links a user to a product with current page/chapter/time
        // positions.  We generate up to 1,000 records.
        $userIds    = \App\Models\User::where('role', '!=', 'admin')->pluck('id')->all();
        $productIds = \App\Models\Product::pluck('id')->all();
        if (empty($userIds) || empty($productIds)) return;

        $count = min(1000, count($userIds) * count($productIds));
        for ($i = 0; $i < $count; $i++) {
            $uid = $userIds[array_rand($userIds)];
            $pid = $productIds[array_rand($productIds)];
            \App\Models\Continues::create([
                'user_id'             => $uid,
                'product_id'          => $pid,
                'current_chapter'     => random_int(1, 20),
                'current_page'        => random_int(1, 500),
                'current_time_seconds'=> random_int(0, 7200),
                'is_active'           => true,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }
    }
}