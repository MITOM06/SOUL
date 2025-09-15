<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Payment;

/**
 * Factory for the UserSubscription model.  Generates realistic subscription
 * periods and randomly assigns a plan tier.  Payment associations are left
 * nullable to avoid deep nested factory creation unless explicitly linked.
 *
 * @extends Factory<\App\Models\UserSubscription>
 */
class UserSubscriptionFactory extends Factory
{
    protected $model = \App\Models\UserSubscription::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', 'now');
        // Add between 30 and 365 days to the start date
        $endDate   = (clone $startDate)->modify('+' . $this->faker->numberBetween(30, 365) . ' days');

        return [
            'user_id'    => User::factory(),
            'plan_key'   => $this->faker->randomElement(['basic','premium','vip']),
            'price_cents'=> $this->faker->numberBetween(5_000, 200_000),
            'start_date' => $startDate,
            'end_date'   => $endDate,
            'status'     => $this->faker->randomElement(['active','expired','canceled','pending']),
            // Leave payment_id null; override in a seeder if linking to a payment
            'payment_id' => null,
        ];
    }
}