<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersSeeder extends Seeder
{
    public function run()
    {
        DB::transaction(function () {
            // 1) Nếu có Spatie Roles, đảm bảo role tồn tại trước
            $hasSpatie = class_exists(\Spatie\Permission\Models\Role::class);
            if ($hasSpatie) {
                $roleModel = \Spatie\Permission\Models\Role::class;
                $roleModel::firstOrCreate(['name' => 'admin']);
                $roleModel::firstOrCreate(['name' => 'user']);
            }

            // 2) Tạo/Update admin idempotent
            $admin = User::updateOrCreate(
                ['email' => 'admin@example.com'], // khóa duy nhất
                [
                    'name'          => 'Admin User',
                    'password_hash' => Hash::make(env('ADMIN_PASSWORD', 'AdminPass123!')),
                    'role'          => 'admin',
                    'is_active'     => true,
                ]
            );

            if (method_exists($admin, 'assignRole') && $hasSpatie) {
                $admin->syncRoles(['admin']); // idempotent
            }

            // 3) Tạo 30 user thường (idempotent theo email)
            //    Sử dụng factory với ->unique() để tránh trùng email
            //    Đảm bảo factory viết vào 'password_hash'
            User::factory()->count(30)->create()->each(function ($u) {
                $u->role = fake()->randomElement(['user', 'admin']);
                $u->save();
            });
        });
    }
}
