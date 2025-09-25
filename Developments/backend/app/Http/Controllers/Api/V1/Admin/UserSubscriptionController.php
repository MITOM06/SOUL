<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\UserSubscription;

class UserSubscriptionController extends Controller
{
    /**
     * Lấy danh sách tất cả subscriptions
     * Có thể filter theo status (?status=active)
     */
    public function index(Request $request)
    {
        $query = UserSubscription::with('user')->orderByDesc('id');

        // Filters
        if ($request->filled('status')) {
            $st = $request->query('status');
            if (in_array($st, ['active', 'canceled', 'expired', 'pending'])) {
                $query->where('status', $st);
            }
        }
        if ($request->filled('plan') || $request->filled('plan_key')) {
            $plan = $request->query('plan', $request->query('plan_key'));
            $query->where('plan_key', $plan);
        }
        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $like = "%{$search}%";
            $query->whereHas('user', function($q) use ($like) {
                $q->where('email','like',$like)
                  ->orWhere('name','like',$like);
            });
        }

        // Pagination
        $per = max(1, (int) $request->query('per_page', 15));
        $subs = $query->paginate($per)->withQueryString();

        return response()->json([
            'success' => true,
            'data'    => $subs,
        ]);
    }

    /**
     * Xem chi tiết 1 subscription
     */
    public function show($id)
    {
        $sub = UserSubscription::with('user')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $sub,
        ]);
    }

    /**
     * Tạo mới subscription
     */
    public function store(Request $request)
    {
        // Chấp nhận cả plan_key và plan
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

        // Nếu tạo active → hủy các subscription active khác
        if ($data['status'] === 'active') {
            UserSubscription::where('user_id', $data['user_id'])
                ->where('status', 'active')
                ->update(['status' => 'canceled']);
        }

        $sub = UserSubscription::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Subscription created',
            'data'    => $sub,
        ], 201);
    }

    /**
     * Cập nhật subscription
     */
    public function update(Request $request, $id)
    {
        $sub = UserSubscription::findOrFail($id);

        // Chấp nhận cả plan_key và plan
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

        // Nếu set thành active → hủy active khác
        if (($data['status'] ?? null) === 'active') {
            UserSubscription::where('user_id', $sub->user_id)
                ->where('id', '!=', $sub->id)
                ->where('status', 'active')
                ->update(['status' => 'canceled']);
        }

        $sub->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Subscription updated',
            'data'    => $sub,
        ]);
    }

    /**
     * Xóa subscription
     */
    public function destroy($id)
    {
        $sub = UserSubscription::findOrFail($id);
        $sub->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription deleted',
        ]);
    }
}
