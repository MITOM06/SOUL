<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $r)
    {
        $users = User::paginate(20);
        return response()->json(['success'=>true,'data'=>$users]);
    }

    public function show(User $user)
    {
        return response()->json(['success'=>true,'data'=>$user]);
    }

    public function update(Request $r, User $user)
    {
        $data = $r->only(['name','email','subscription_level']);
        if ($r->filled('password')) {
            $data['password'] = Hash::make($r->password);
        }
        $user->update($data);
        return response()->json(['success'=>true,'data'=>$user]);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['success'=>true,'message'=>'Deleted']);
    }
}
