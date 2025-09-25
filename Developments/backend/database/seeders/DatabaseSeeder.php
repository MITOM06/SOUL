<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Master database seeder.  This seeder runs all other seeders in the
 * appropriate order to ensure foreign key constraints are satisfied.  Adjust
 * the order here if you add new seeders or need to control relationships.
 */
class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            UsersSeeder::class,
            ProductsSeeder::class,
            ProductFilesSeeder::class,
            DemoCommerceSeeder::class,
            UserSubscriptionsSeeder::class,
            FavouritesSeeder::class,
            ContinuesSeeder::class,
            // PaymentsSeeder is covered by DemoCommerceSeeder (for paid orders)
        ]);
    }
}
