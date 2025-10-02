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
                'error' => [
                    'code'    => 'USER_SUSPENDED',
                    'message' => 'Your account has been temporarily locked for violating community standards. Please contact support at (+84) 0900-123-456.'
                ]
            ], 403);
        }
        return $next($request);
    }
}
