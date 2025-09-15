<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
	// Lấy thông tin user hiện tại
	public function me(Request $request)
	{
		$user = $request->user();
		if (!$user) {
			return response()->json([
				'success' => false,
				'message' => 'Not authenticated.'
			], 401);
		}
		return response()->json([
			'success' => true,
			'data' => [
				'id' => $user->id,
				'email' => $user->email,
				'name' => $user->name,
				'role' => $user->role,
				'is_active' => $user->is_active,
			]
		]);
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
