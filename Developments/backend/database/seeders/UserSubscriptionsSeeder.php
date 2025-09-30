<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserSubscription;
use Carbon\Carbon;

/**
 * Seed the user_subscriptions table.  Subscriptions are generated via the
 * UserSubscriptionFactory and include start and end dates.
 */
class UserSubscriptionsSeeder extends Seeder
{
    public function run()
    {
        // Generate a robust set of subscriptions so that many users have active
        // plans.  Each subscription picks a random user from the pool of
        // non‑admin accounts.  Dates are distributed between the start of
        // 2024 and now to simulate organic growth over time.  Prices range
        // from $50 to $500.
        $userIds = \App\Models\User::where('role', '!=', 'admin')->pluck('id')->all();
        if (empty($userIds)) return;

        $plans     = ['basic','premium','vip'];
        $statuses  = ['active','expired','canceled','pending'];
        $start  = Carbon::create(2024, 1, 1, 0, 0, 0);
        $end    = Carbon::now();
        // Create around half as many subscriptions as users (roughly 250)
        $count  = min(250, count($userIds));
        for ($i = 0; $i < $count; $i++) {
            $uid    = $userIds[array_rand($userIds)];
            $sDate  = $this->randomDateBetween($start, $end);
            $eDate  = (clone $sDate)->addDays(random_int(30, 365));
            \App\Models\UserSubscription::create([
                'user_id'     => $uid,
                'plan_key'    => $plans[array_rand($plans)],
                'price_cents' => random_int(5_000, 50_000),
                'start_date'  => $sDate,
                'end_date'    => $eDate,
                'status'      => $statuses[array_rand($statuses)],
                'payment_id'  => null,
                'created_at'  => $sDate,
                'updated_at'  => $sDate,
            ]);
        }
    }

    /**
     * Generate a random date between two Carbon instances.
     */
    private function randomDateBetween(Carbon $start, Carbon $end): Carbon
    {
        $min = $start->getTimestamp();
        $max = $end->getTimestamp();
        $ts  = random_int($min, $max);
        return Carbon::createFromTimestamp($ts);
    }
}