<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Hỗ trợ cả Spatie lẫn cột role
        $isAdmin = false;
        if ($user) {
            if (method_exists($user, 'hasRole')) {
                $isAdmin = $user->hasRole('admin');
            } else {
                $isAdmin = ($user->role ?? null) === 'admin';
            }
        }

        if (!$isAdmin) {
            return response()->json([
                'error' => ['code' => 'FORBIDDEN', 'message' => 'Admin privileges required.']
            ], 403);
        }

        return $next($request);
    }
}
