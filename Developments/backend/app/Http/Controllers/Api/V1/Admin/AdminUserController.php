<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserController extends Controller
{
    /**
     * Danh sách user (có phân trang + filter theo role)
     */
    public function index(Request $request)
    {
        $role = $request->get('role');
    
        $users = User::query()
            ->when($role, fn($q) => $q->where('role', $role))
            ->latest() // 👈 chính là orderBy('created_at','desc')
            ->paginate(15);
    
        return response()->json($users);
    }


    /**
     * Chi tiết user
     */
    public function show($id)
    {
        $user = User::with(['orders', 'payments', 'subscriptions'])->find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    /**
     * Tạo user mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'name' => 'nullable|string|max:150',
            'role' => 'required|in:user,admin',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'name' => $request->name,
            'role' => $request->role,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'name' => 'nullable|string|max:150',
            'role' => 'sometimes|in:user,admin',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($request->filled('email')) {
            $user->email = $request->email;
        }
        if ($request->filled('name')) {
            $user->name = $request->name;
        }
        if ($request->filled('role')) {
            $user->role = $request->role;
        }
        if ($request->has('is_active')) {
            $user->is_active = $request->boolean('is_active');
        }
        if ($request->filled('password')) {
            $user->password_hash = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user,
        ]);
    }

    /**
     * Xoá user (kèm dữ liệu liên quan)
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        try {
            // Xoá các quan hệ liên quan nếu có
            $user->orders()->delete();
            $user->payments()->delete();
            $user->subscriptions()->delete();
            // Nếu có favourites, carts... thì thêm tiếp ở đây

            $user->delete();

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
