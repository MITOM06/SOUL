<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * Factory for the Order model.  Orders belong to users and include
 * a total amount in cents, a status and a payment method.
 *
 * @extends Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    protected $model = \App\Models\Order::class;

    public function definition(): array
    {
        return [
            'user_id'      => User::factory(),
            'total_cents'  => $this->faker->numberBetween(0, 200_000),
            'status'       => $this->faker->randomElement(['pending','paid','cancelled','refunded']),
            'payment_method' => $this->faker->randomElement(['stripe','paypal','momo','card']),
        ];
    }
}