<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserController extends Controller
{
    /**
     * 📌 Danh sách user (có phân trang + filter role)
     */
    public function index(Request $request)
    {
        $role = $request->query('role');

        $users = User::query()
            ->when($role, fn($q) => $q->where('role', $role))
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    /**
     * 📌 Chi tiết user
     */
    public function show($id)
    {
        $user = User::with(['orders', 'payments', 'subscriptions'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /**
     * 📌 Tạo user mới
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'name'     => 'nullable|string|max:150',
            'role'     => 'required|in:user,admin',
            'is_active'=> 'boolean',
        ]);

        $user = User::create([
            'email'         => $data['email'],
            'password_hash' => Hash::make($data['password']),
            'name'          => $data['name'] ?? null,
            'role'          => $data['role'],
            'is_active'     => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data'    => $user,
        ], 201);
    }

    /**
     * 📌 Cập nhật user
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $data = $request->validate([
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'name'     => 'nullable|string|max:150',
            'role'     => 'sometimes|in:user,admin',
            'is_active'=> 'sometimes|boolean',
        ]);

        if (isset($data['email'])) {
            $user->email = $data['email'];
        }
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        if (isset($data['role'])) {
            $user->role = $data['role'];
        }
        if ($request->has('is_active')) {
            $user->is_active = $request->boolean('is_active');
        }
        if (!empty($data['password'])) {
            $user->password_hash = Hash::make($data['password']);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data'    => $user,
        ]);
    }

    /**
     * 📌 Xoá user (và dữ liệu liên quan)
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        try {
            // Xoá các quan hệ liên quan nếu có
            $user->orders()->delete();
            $user->payments()->delete();
            $user->subscriptions()->delete();
            // Nếu có favourites, carts... thì thêm tiếp ở đây

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
