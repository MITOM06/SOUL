<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserSubscription;

/**
 * Seed the user_subscriptions table.  Subscriptions are generated via the
 * UserSubscriptionFactory and include start and end dates.
 */
class UserSubscriptionsSeeder extends Seeder
{
    public function run()
    {
        UserSubscription::factory()->count(30)->create();
    }
}