<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

/**
 * Seed the users table with an admin and a batch of sample users.  The
 * sample users are created using the UserFactory so they conform to the
 * structure defined in your migrations (password_hash, role, etc.).
 */
class UsersSeeder extends Seeder
{
    public function run()
    {
        // Always ensure there is at least one admin user
        $adminId = DB::table('users')->insertGetId([
            'email'         => 'admin@example.com',
            'password_hash' => Hash::make('AdminPass123!'),
            'role'          => 'admin',
            'name'          => 'Admin User',
            'is_active'     => true,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Generate roughly thirty sample users
        User::factory()->count(30)->create();

        // Assign the admin role via Spatie if installed
        if (class_exists(\Spatie\Permission\Models\Role::class)) {
            $userModel = User::find($adminId);
            if ($userModel && method_exists($userModel, 'assignRole')) {
                $userModel->assignRole('admin');
            }
        }
    }
}