<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && $user->is_active !== true) {
            return response()->json([
                'error' => ['code' => 'USER_INACTIVE', 'message' => 'Your account is inactive.']
            ], 403);
        }
        return $next($request);
    }
}
