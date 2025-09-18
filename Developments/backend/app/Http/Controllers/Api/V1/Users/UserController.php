<?php

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // public function index(Request $r)
    // {
    //     $users = User::paginate(20);
    //     return response()->json(['success'=>true,'data'=>$users]);
    // }

    // public function show(User $user)
    // {
    //     return response()->json(['success'=>true,'data'=>$user]);
    // }

    // public function update(Request $r, User $user)
    // {
    //     $data = $r->only(['name','email','subscription_level']);
    //     if ($r->filled('password')) {
    //         $data['password'] = Hash::make($r->password);
    //     }
    //     $user->update($data);
    //     return response()->json(['success'=>true,'data'=>$user]);
    // }

    // public function destroy(User $user)
    // {
    //     $user->delete();
    //     return response()->json(['success'=>true,'message'=>'Deleted']);
    // }

    public function getProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'dob' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        // So sánh với password_hash thay vì password
        if (!Hash::check($request->current_password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 400);
        }

        // Update lại password_hash
        $user->update([
            'password_hash' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }
}
