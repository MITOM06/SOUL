<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Carbon\Carbon;

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

            // 3) Create 500 regular users.  Generate all users first, then
            // randomise their created_at/updated_at timestamps to fall within
            // the range 2024‑01‑01 to now.  Using Carbon ensures proper
            // handling of timezones and date arithmetic.
            $users = User::factory()->count(500)->create(['role' => 'user']);

            $start = Carbon::create(2024, 1, 1, 0, 0, 0);
            $end   = Carbon::now();
            foreach ($users as $u) {
                $random = $this->randomDateBetween($start, $end);
                $u->update([
                    'created_at' => $random,
                    'updated_at' => $random,
                ]);
            }
        });
    }

    /**
     * Generate a random Carbon instance between two dates.  This helper uses
     * PHP's random_int on the unix timestamp range to ensure uniform
     * distribution.  Both start and end must be Carbon instances.
     */
    private function randomDateBetween(Carbon $start, Carbon $end): Carbon
    {
        $min = $start->getTimestamp();
        $max = $end->getTimestamp();
        $timestamp = random_int($min, $max);
        return Carbon::createFromTimestamp($timestamp);
    }
}
