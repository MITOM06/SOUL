<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Product;

/**
 * Factory for the ProductFile model.  Each file belongs to a product and
 * includes metadata dependent on its file type.  Uses a random URL for
 * demonstration purposes.
 *
 * @extends Factory<\App\Models\ProductFile>
 */
class ProductFileFactory extends Factory
{
    protected $model = \App\Models\ProductFile::class;

    public function definition(): array
    {
        $fileType = $this->faker->randomElement(['pdf','epub','mobi','mp3','mp4','image']);
        // Determine file metadata based on type
        if (in_array($fileType, ['pdf','epub','mobi'])) {
            $meta = [
                'pages' => $this->faker->numberBetween(50, 500),
            ];
        } elseif (in_array($fileType, ['mp3','mp4'])) {
            $meta = [
                'duration_seconds' => $this->faker->numberBetween(300, 7200),
            ];
        } else {
            $meta = [];
        }

        return [
            // Associate a new product if none is provided when creating
            'product_id'   => Product::factory(),
            'file_type'    => $fileType,
            'file_url'     => $this->faker->url(),
            'filesize_bytes' => $this->faker->numberBetween(100_000, 20_000_000),
            'is_preview'   => $this->faker->boolean(20),
            'meta'         => json_encode($meta),
        ];
    }
}