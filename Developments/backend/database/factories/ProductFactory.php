<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for the Product model.  Each product can be an ebook or a podcast
 * and includes a slug and metadata in JSON format.  The content is
 * intentionally generated in English as the site is English language.
 *
 * @extends Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\Product::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        // Choose between an ebook or podcast
        $type = $this->faker->randomElement(['ebook', 'podcast']);
        // Generate a random title; keep it concise
        $title = $this->faker->sentence(4, true);

        // Build metadata based on the product type
        if ($type === 'ebook') {
            $metadata = [
                'pages'    => $this->faker->numberBetween(50, 500),
                'author'   => $this->faker->name(),
                'isbn'     => $this->faker->isbn13(),
                'language' => 'en',
            ];
        } else {
            $metadata = [
                'duration_seconds' => $this->faker->numberBetween(600, 7200),
                'author'           => $this->faker->name(),
                'language'         => 'en',
            ];
        }

        return [
            'type'         => $type,
            'title'        => $title,
            'description'  => $this->faker->paragraph(3, true),
            // Price stored in cents; some podcasts may be free (0)
            'price_cents'  => $this->faker->numberBetween(0, 200000),
            'thumbnail_url'=> $this->faker->imageUrl(600, 800, $type === 'ebook' ? 'books' : 'technology', true),
            'category'     => $this->faker->randomElement(['Programming','Design','Business','Marketing','Health','Education']),
            // Add a random suffix to ensure slug uniqueness
            'slug'         => Str::slug($title) . '-' . Str::random(5),
            'metadata'     => json_encode($metadata),
            'is_active'    => true,
        ];
    }
}