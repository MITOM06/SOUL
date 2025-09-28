<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /* ======================== PROFILE ======================== */

    public function getProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'   => ['nullable', 'string', 'max:255'],
            'email'  => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'dob'    => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /* ===================== CHANGE PASSWORD ===================== */

    /**
     * Đổi mật khẩu cho user đang đăng nhập.
     *
     * - Hỗ trợ nhiều key để tương thích mọi client:
     *   + current_password | old_password
     *   + new_password | password
     *   + new_password_confirmation | password_confirmation | confirm_password
     * - Chấp nhận POST|PUT|PATCH, JSON hoặc form-encoded.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        // Chuẩn hoá input về 3 field cố định
        $current = $request->input('current_password', $request->input('old_password'));
        $new     = $request->input('new_password', $request->input('password'));
        $confirm = $request->input('new_password_confirmation',
                    $request->input('password_confirmation',
                    $request->input('confirm_password')));

        // Gộp lại để validator làm việc
        $payload = [
            'current_password'       => $current,
            'password'               => $new,
            'password_confirmation'  => $confirm,
        ];

        $validator = Validator::make($payload, [
            'current_password'      => ['required', 'string'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.confirmed'    => 'Password confirmation does not match.',
            'password.min'          => 'New password must be at least :min characters.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Kiểm tra mật khẩu hiện tại (cột đang dùng là password_hash)
        if (! Hash::check($payload['current_password'], $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 400);
        }

        // Cập nhật
        $user->forceFill([
            'password_hash' => Hash::make($payload['password']),
        ])->save();

        // (tuỳ chọn) Invalidate token khác nếu muốn
        // if (method_exists($user, 'tokens')) $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
        ]);
    }

    /* ================== (Tùy chọn) CRUD cho admin ==================
     * Nếu cần, bỏ comment các block dưới để dùng lại CRUD.
     *
     * public function index(Request $r) {...}
     * public function show(User $user) {...}
     * public function store(Request $r) {...}
     * public function update(Request $r, User $user) {...}
     * public function destroy(User $user) {...}
     * public function indexByRole(Request $r, string $role) {...}
     * public function showByRole(string $role, User $user) {...}
     * public function storeByRole(Request $r, string $role) {...}
     * public function updateByRole(Request $r, string $role, User $user) {...}
     * public function destroyByRole(string $role, User $user) {...}
     */
}
