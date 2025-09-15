<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed.'
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.'
            ], 401);
        }
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is inactive.'
            ], 403);
        }

        // Sử dụng Sanctum để tạo cookie đăng nhập
        Auth::login($user);

        // Laravel sẽ tự động gửi cookie session nếu guard là web
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'is_active' => $user->is_active,
            ],
            'message' => 'Login successful.'
        ]);
    }
}