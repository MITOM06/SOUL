<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Product;

/**
 * Factory for the Continues model (progress tracking).  Because "continue" is
 * a reserved keyword in PHP, the model should be named Continues.  Each
 * record tracks the user's current progress within a product.
 *
 * @extends Factory<\App\Models\Continues>
 */
class ContinuesFactory extends Factory
{
    protected $model = \App\Models\Continues::class;

    public function definition(): array
    {
        return [
            'user_id'             => User::factory(),
            'product_id'          => Product::factory(),
            'current_chapter'     => $this->faker->numberBetween(1, 20),
            'current_page'        => $this->faker->numberBetween(1, 500),
            // Podcasts track time in seconds; for ebooks this can be null
            'current_time_seconds' => $this->faker->numberBetween(0, 7200),
            'is_active'           => true,
        ];
    }
}