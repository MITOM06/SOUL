<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

/**
 * Seed the products table with a variety of ebooks and podcasts.  Using the
 * ProductFactory ensures that each product includes English titles and
 * metadata appropriate for its type.
 */
class ProductsSeeder extends Seeder
{
    public function run()
    {
        // Create thirty products; the factory will randomise type, price and metadata
        Product::factory()->count(30)->create();
    }
}