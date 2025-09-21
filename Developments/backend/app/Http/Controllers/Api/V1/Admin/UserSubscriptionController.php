<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\UserSubscription;

class UserSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = UserSubscription::with('user')->orderByDesc('id');
        if ($request->filled('status')) {
            $st = $request->query('status');
            if (in_array($st, ['active','canceled','expired','pending'])) {
                $query->where('status', $st);
            }
        }
        // Trả về mảng thuần (FE tự phân trang client-side 15 dòng)
        $subs = $query->get();

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
            'plan_key'    => ['required', Rule::in(['basic', 'premium', 'vip'])],
            'status'      => ['required', Rule::in(['active', 'canceled', 'expired', 'pending'])],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'price_cents' => ['nullable', 'integer', 'min:0'],
            'payment_id'  => ['nullable', 'exists:payments,id'],
        ]);

        // If creating an active sub, cancel other active subs of this user first
        if (($data['status'] ?? null) === 'active') {
            UserSubscription::where('user_id', $data['user_id'])
                ->where('status', 'active')
                ->update(['status' => 'canceled']);
        }

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
            'plan_key'    => ['sometimes', Rule::in(['basic', 'premium', 'vip'])],
            'status'      => ['sometimes', Rule::in(['active', 'canceled', 'expired', 'pending'])],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'price_cents' => ['nullable', 'integer', 'min:0'],
            'payment_id'  => ['nullable', 'exists:payments,id'],
        ]);

        // If setting to active, cancel other actives for the same user
        if (($data['status'] ?? null) === 'active') {
            UserSubscription::where('user_id', $sub->user_id)
                ->where('id', '!=', $sub->id)
                ->where('status', 'active')
                ->update(['status' => 'canceled']);
        }

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
