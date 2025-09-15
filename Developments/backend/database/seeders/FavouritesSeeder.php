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
        Favourite::factory()->count(30)->create();
    }
}