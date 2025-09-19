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
//     public function index(Request $r)
//     {
//         $query = User::query();
//         if ($r->filled('role')) {
//             $role = $r->get('role');
//             if (in_array($role, ['admin', 'user'], true)) {
//                 $query->where('role', $role);
//             }
//         }
//         $perPage = (int) ($r->get('per_page', 20));
//         $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 20;
//         $users = $query->orderByDesc('id')->paginate($perPage);
//         return response()->json(['success' => true, 'data' => $users]);
//     }

//     public function show(User $user)
//     {
//         return response()->json(['success' => true, 'data' => $user]);
//     }

//     public function store(Request $r)
//     {
//         $validator = Validator::make($r->all(), [
//             'name'       => ['nullable', 'string', 'max:150'],
//             'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
//             'password'   => ['required', 'string', 'min:6', 'max:255'],
//             'is_active'  => ['sometimes', 'boolean'],
//             'role'       => ['sometimes', Rule::in(['admin', 'user'])],
//         ]);
//         if ($validator->fails()) {
//             return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
//         }
//         $role = $r->get('role', 'user');
//         $user = new User();
//         $user->name = $r->get('name');
//         $user->email = $r->get('email');
//         $user->password_hash = Hash::make($r->get('password'));
//         $user->is_active = (bool) $r->get('is_active', true);
//         $user->role = $role;
//         $user->save();
//         return response()->json(['success' => true, 'data' => $user], 201);
//     }

//     public function update(Request $r, User $user)
//     {
//         $validator = Validator::make($r->all(), [
//             'name'       => ['nullable', 'string', 'max:150'],
//             'email'      => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
//             'password'   => ['sometimes', 'string', 'min:6', 'max:255'],
//             'is_active'  => ['sometimes', 'boolean'],
//         ]);
//         if ($validator->fails()) {
//             return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
//         }
//         $data = $r->only(['name', 'email', 'is_active']);
//         if ($r->filled('password')) {
//             $data['password_hash'] = Hash::make($r->input('password'));
//         }
//         $user->fill($data);
//         $user->save();
//         return response()->json(['success' => true, 'data' => $user]);
//     }

//     public function destroy(User $user)
//     {
//         $user->delete();
//         return response()->json(['success' => true, 'message' => 'Deleted']);
//     }
// // Role-scoped helpers
//     public function indexByRole(Request $r, string $role)
//     {
//         $r->merge(['role' => $role]);
//         return $this->index($r);
//     }

//     public function showByRole(string $role, User $user)
//     {
//         if ($user->role !== $role) {
//             return response()->json(['success' => false, 'message' => 'Not found'], 404);
//         }
//         return $this->show($user);
//     }

//     public function storeByRole(Request $r, string $role)
//     {
//         $r->merge(['role' => $role]);
//         return $this->store($r);
//     }

//     public function updateByRole(Request $r, string $role, User $user)
//     {
//         if ($user->role !== $role) {
//             return response()->json(['success' => false, 'message' => 'Not found'], 404);
//         }
//         return $this->update($r, $user);
//     }

//     public function destroyByRole(string $role, User $user)
//     {
//         if ($user->role !== $role) {
//             return response()->json(['success' => false, 'message' => 'Not found'], 404);
//         }
//         return $this->destroy($user);
//     }

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
