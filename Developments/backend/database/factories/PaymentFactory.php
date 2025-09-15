<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Order;
use App\Models\User;

/**
 * Factory for the Payment model.  Payments may be associated with both an order
 * and a user.  The provider and status values are chosen randomly.
 *
 * @extends Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = \App\Models\Payment::class;

    public function definition(): array
    {
        return [
            'order_id'           => Order::factory(),
            'user_id'            => User::factory(),
            'provider'           => $this->faker->randomElement(['stripe','momo','paypal','credit_card']),
            'amount_cents'       => $this->faker->numberBetween(0, 200_000),
            'currency'           => 'USD',
            'status'             => $this->faker->randomElement(['initiated','success','failed','refunded']),
            'provider_payment_id'=> $this->faker->uuid(),
            'raw_response'       => json_encode(['reference' => $this->faker->uuid(), 'status' => 'test']),
        ];
    }
}