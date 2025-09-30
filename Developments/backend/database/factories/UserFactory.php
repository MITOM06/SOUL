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
        /*
         * Generate a more meaningful user profile.  Each user has a realistic
         * full name and a Gmail address derived from their name.  Using
         * slugification (dots between names) ensures readability while
         * preserving uniqueness.  The password is constant across fake
         * accounts for simplicity.
         */
        $fullName = $this->faker->name();
        // Slugify the name into a lowercase email‑friendly format. Replace
        // non‑letters with dots and trim off stray dots on both ends.
        $slug = strtolower(preg_replace('/[^a-zA-Z]+/', '.', $fullName));
        $emailBase = trim($slug, '.');
        // Compose the Gmail address using the slug base.  Should uniqueness
        // conflict arise, Laravel's unique constraint on email along with
        // seeder loops will handle collisions gracefully.
        $email = $emailBase . '@gmail.com';
        return [
            'email'         => $email,
            'password_hash' => Hash::make('Password123!'),
            'role'          => 'user',
            'name'          => $fullName,
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