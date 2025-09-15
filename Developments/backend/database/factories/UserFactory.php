<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * Factory definition for the User model.  Our users table uses a
 * password_hash field instead of the default password column and includes
 * additional attributes like role and is_active.  This factory generates
 * realistic English user data.
 *
 * @extends Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = \App\Models\User::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'email'         => $this->faker->unique()->safeEmail(),
            'password_hash' => Hash::make('Password123!'),
            'role'          => 'user',
            'name'          => $this->faker->name(),
            'is_active'     => true,
        ];
    }

    /**
     * Indicate that the user is an admin.  Use this state when you need to
     * quickly generate admin accounts via the factory.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }
}