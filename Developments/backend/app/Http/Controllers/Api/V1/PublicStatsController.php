<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PublicStatsController extends Controller
{
    /**
     * GET /api/v1/public/stats
     * Public, aggregated counters only — safe to expose.
     * - total_users: total users
     * - total_podcasts: active podcast count
     * - total_ebooks: active ebook count
     * - total_members: distinct users with active premium or vip plan
     */
    public function counts()
    {
        $totalUsers = (int) DB::table('users')->count();
        $totalPodcasts = (int) DB::table('products')->where('is_active', 1)->where('type', 'podcast')->count();
        $totalEbooks = (int) DB::table('products')->where('is_active', 1)->where('type', 'ebook')->count();

        // Distinct users with active premium or vip subscription
        $totalMembers = (int) DB::table('user_subscriptions')
            ->where('status', 'active')
            ->whereIn('plan_key', ['premium', 'vip'])
            ->distinct('user_id')
            ->count('user_id');

        return response()->json([
            'success' => true,
            'data' => [
                'total_users'    => $totalUsers,
                'total_podcasts' => $totalPodcasts,
                'total_ebooks'   => $totalEbooks,
                'total_members'  => $totalMembers,
            ],
        ]);
    }
}

