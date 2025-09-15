<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Database\QueryException;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|max:255',
            'name' => 'nullable|string|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed.'
            ], 422);
        }

        try {
            $user = new User();
            $user->email = $request->email;
            $user->password_hash = Hash::make($request->password);
            $user->role = 'user';
            $user->name = $request->name;
            $user->is_active = true;
            $user->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at,
                ],
                'message' => 'User registered successfully.'
            ], 201);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}