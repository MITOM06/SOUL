<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Populate the roles and permissions tables.  If the Spatie permission
 * package is present, models are used to create roles and permissions.  If not,
 * the tables are populated directly via the DB facade, assuming the tables
 * exist.  Adjust the permission names as appropriate for your application.
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Use Spatie's models when available
        if (class_exists(\Spatie\Permission\Models\Role::class)) {
            $permissionNames = [
                'products.view', 'products.create', 'products.update', 'products.delete',
                'orders.view', 'orders.manage', 'users.manage',
            ];
            foreach ($permissionNames as $p) {
                \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $p]);
            }
            // Create roles
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'user']);
            // Assign all permissions to admin
            $admin = \Spatie\Permission\Models\Role::where('name', 'admin')->first();
            if ($admin) {
                $admin->givePermissionTo($permissionNames);
            }
        } else {
            // Fallback: insert into roles and permissions tables directly if present
            if (Schema::hasTable('roles')) {
                DB::table('roles')->insertOrIgnore([
                    ['name' => 'admin', 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()],
                    ['name' => 'user', 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()],
                ]);
            }
            if (Schema::hasTable('permissions')) {
                DB::table('permissions')->insertOrIgnore([
                    ['name' => 'products.view', 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()],
                    ['name' => 'orders.manage', 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()],
                ]);
            }
        }
    }
}