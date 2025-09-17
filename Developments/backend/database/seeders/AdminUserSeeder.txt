<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Seed a single admin user.  The default password should be changed after
 * seeding in a real application.
 */
class AdminUserSeeder extends Seeder
{
    public function run()
    {
        $u = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'          => 'Admin',
                'password_hash' => Hash::make('password123'), // change immediately
                'role'          => 'admin',
                'is_active'     => true,
            ]
        );
        if (method_exists($u, 'assignRole')) {
            $u->assignRole('admin');
        }
    }
}