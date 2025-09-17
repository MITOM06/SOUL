<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'email' => 'user@example.com',
            'password_hash' => Hash::make('password123'), // mật khẩu
            'role' => 'user',
            'name' => 'Test User',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
