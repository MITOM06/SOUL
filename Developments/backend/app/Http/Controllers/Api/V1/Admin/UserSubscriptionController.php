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
        return response()->json([
            'success' => false,
            'message' => 'Admin editing of user subscriptions is disabled',
        ], 403);
    }

    /**
     * Cập nhật subscription
     */
    public function update(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Admin editing of user subscriptions is disabled',
        ], 403);
    }

    /**
     * Xóa subscription
     */
    public function destroy($id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Admin editing of user subscriptions is disabled',
        ], 403);
    }
}
