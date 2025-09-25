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

            // 2) Create three admins (idempotent by email)
            $admins = [
                ['email' => 'admin1@soul.app', 'name' => 'Ava Thompson'],
                ['email' => 'admin2@soul.app', 'name' => 'Liam Peterson'],
                ['email' => 'admin3@soul.app', 'name' => 'Sophia Martinez'],
            ];
            foreach ($admins as $i => $data) {
                $admin = User::updateOrCreate(
                    ['email' => $data['email']],
                    [
                        'name'          => $data['name'],
                        'password_hash' => Hash::make(
                            env(
                                'ADMIN_PASSWORD',
                                config('app.default_admin_password', 'AdminPass123!')
                            )
                        ),
                        'role'          => 'admin',
                        'is_active'     => true,
                    ]
                );
                if (method_exists($admin, 'assignRole') && $hasSpatie) {
                    $admin->syncRoles(['admin']);
                }
            }

            // 3) Create 200 regular users with meaningful English names
            User::factory()->count(200)->create(['role' => 'user']);
        });
    }
}
