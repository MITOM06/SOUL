<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\UserSubscription;
use Carbon\Carbon;

class UserSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $subs = UserSubscription::where('user_id', $user->id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $subs,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        // Chấp nhận cả plan_key lẫn plan từ FE
        $planKey = $request->input('plan_key', $request->input('plan'));

        $request->merge(['plan_key' => $planKey]);

        $request->validate([
            'plan_key' => ['required', Rule::in(['basic', 'standard', 'premium'])],
        ]);

        $pricing = [
            'basic'    => 0,
            'standard' => 9900,
            'premium'  => 19900,
        ];

        $now = Carbon::now();
        $end = (clone $now)->addMonth();

        $sub = UserSubscription::create([
            'user_id'     => $user->id,
            'plan_key'    => $planKey,                       // 👈 Ghi đúng cột
            'status'      => 'active',
            'start_date'  => $now,
            'end_date'    => $end,
            'price_cents' => $pricing[$planKey] ?? 0,
            'payment_id'  => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscribed successfully.',
            'data'    => $sub,
        ], 201);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $sub = UserSubscription::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $sub->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription removed.',
        ]);
    }
}
