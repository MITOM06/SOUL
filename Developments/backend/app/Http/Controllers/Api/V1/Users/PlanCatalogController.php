<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PlanInclusions;

class PlanCatalogController extends Controller
{
    /**
     * GET /api/v1/subscriptions/plan-details
     * Optional query: plan=premium|vip
     * Returns included products (ebooks & podcasts) for plans.
     */
    public function details(Request $r)
    {
        $plan = strtolower((string) $r->query('plan'));
        $allowed = ['premium','vip'];
        $payload = [];
        if ($plan && in_array($plan, $allowed, true)) {
            $payload[$plan] = PlanInclusions::includedProducts($plan);
        } else {
            foreach ($allowed as $key) {
                $payload[$key] = PlanInclusions::includedProducts($key);
            }
        }
        return response()->json(['success' => true, 'data' => $payload]);
    }
}

