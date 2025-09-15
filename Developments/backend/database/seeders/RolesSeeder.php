<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Seed the roles table.  If using Spatie's permission package, this seeder
 * creates the basic admin and user roles.  Duplicate role creation is
 * handled by firstOrCreate.
 */
class RolesSeeder extends Seeder
{
    public function run()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);
    }
}