<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
	// Lấy thông tin user hiện tại
	// Get current authenticated user (kept as `me` for compatibility)
	public function me(Request $request)
	{
		$user = $request->user();
		if (!$user) {
			return response()->json([
				'success' => false,
				'message' => 'Not authenticated.'
			], 401);
		}
        // Lấy gói hiện tại (nếu có) và tự động hết hạn nếu quá hạn 1 tháng (premium/vip)
        $currentSub = $user->subscriptions()
            ->where('status', 'active')
            ->orderByDesc('end_date')
            ->first();

        if ($currentSub) {
            $plan = (string) $currentSub->plan_key;
            $end  = $currentSub->end_date ? \Carbon\Carbon::parse($currentSub->end_date) : null;
            if (in_array($plan, ['premium','vip'], true) && $end && $end->isPast()) {
                // Hết hạn → chuyển subscription về expired
                $currentSub->status = 'expired';
                $currentSub->save();
                $currentSub = null; // không còn active
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'is_active' => $user->is_active,
                // Dùng cho FE hiện plan hiện tại
                'subscription_level' => $currentSub?->plan_key ?? 'basic',
                'current_plan' => $currentSub?->plan_key,
                'current_plan_status' => $currentSub?->status,
                'current_plan_end_date' => $currentSub?->end_date,
            ]
        ]);
	}

	// Backwards-compatible alias used by routes: getUser
	public function getUser(Request $request)
	{
		return $this->me($request);
	}

	// Đăng xuất user (xóa session/cookie)
	public function logout(Request $request)
	{
		Auth::logout();
		$request->session()->invalidate();
		$request->session()->regenerateToken();
		return response()->json([
			'success' => true,
			'message' => 'Logged out successfully.'
		]);
	}
}
