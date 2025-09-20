<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'name'                  => 'nullable|string|min:2|max:150',
            'email'                 => 'required|email:rfc,dns|unique:users,email',
            'password'              => 'required|string|min:8',
            'password_confirmation' => 'required|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Create user (lưu ý project dùng cột password_hash)
        $user = new User();
        $user->email        = $request->input('email');
        $user->password_hash= Hash::make($request->input('password'));
        $user->name         = $request->input('name');
        $user->role         = 'user';
        $user->is_active    = true;
        $user->save();

        // Tạo Sanctum token để frontend dùng Bearer
        // (User model của bạn đã use HasApiTokens)
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'id'         => $user->id,
                'email'      => $user->email,
                'name'       => $user->name,
                'role'       => $user->role,
                'is_active'  => $user->is_active,
                'token'      => $token, // 👈 QUAN TRỌNG: gửi token cho FE
            ],
            'message' => 'User registered successfully.',
        ], 201);
    }
}
