<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\UserSubscription;

class UserSubscriptionController extends Controller
{
    public function index()
    {
        $subs = UserSubscription::with('user')->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data'    => $subs,
        ]);
    }

    public function show($id)
    {
        $sub = UserSubscription::with('user')->findOrFail($id);
        return response()->json([
            'success' => true,
            'data'    => $sub,
        ]);
    }

    public function store(Request $request)
    {
        // chấp nhận cả plan_key và plan
        $planKey = $request->input('plan_key', $request->input('plan'));
        $request->merge(['plan_key' => $planKey]);

        $data = $request->validate([
            'user_id'     => ['required', 'exists:users,id'],
            'plan_key'    => ['required', Rule::in(['basic', 'standard', 'premium'])],
            'status'      => ['required', Rule::in(['active', 'canceled', 'expired'])],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'price_cents' => ['nullable', 'integer', 'min:0'],
            'payment_id'  => ['nullable', 'exists:payments,id'],
        ]);

        $sub = UserSubscription::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Created.',
            'data'    => $sub,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $sub = UserSubscription::findOrFail($id);

        // chấp nhận cả plan_key và plan
        $planKey = $request->has('plan_key') ? $request->input('plan_key')
                  : ($request->has('plan') ? $request->input('plan') : null);

        if ($planKey !== null) {
            $request->merge(['plan_key' => $planKey]);
        }

        $data = $request->validate([
            'plan_key'    => ['sometimes', Rule::in(['basic', 'standard', 'premium'])],
            'status'      => ['sometimes', Rule::in(['active', 'canceled', 'expired'])],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'price_cents' => ['nullable', 'integer', 'min:0'],
            'payment_id'  => ['nullable', 'exists:payments,id'],
        ]);

        $sub->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Updated.',
            'data'    => $sub,
        ]);
    }

    public function destroy($id)
    {
        $sub = UserSubscription::findOrFail($id);
        $sub->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deleted.',
        ]);
    }
}
