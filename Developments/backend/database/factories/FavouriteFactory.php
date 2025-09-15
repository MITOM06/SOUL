<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Product;

/**
 * Factory for the Favourite model.  Each favourite links a user and a product.
 *
 * @extends Factory<\App\Models\Favourite>
 */
class FavouriteFactory extends Factory
{
    protected $model = \App\Models\Favourite::class;

    public function definition(): array
    {
        return [
            'user_id'    => User::factory(),
            'product_id' => Product::factory(),
        ];
    }
}