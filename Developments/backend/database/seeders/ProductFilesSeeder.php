<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductFile;

/**
 * Seed the product_files table.  We generate more files than products to
 * simulate multiple formats and previews per product.  Each file will be
 * linked to a product automatically via the factory definition.
 */
class ProductFilesSeeder extends Seeder
{
    public function run()
    {
        // Generate around sixty files; adjust the count as needed
        ProductFile::factory()->count(60)->create();
    }
}