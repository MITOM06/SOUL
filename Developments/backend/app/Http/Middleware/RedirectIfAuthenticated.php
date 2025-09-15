<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RedirectIfAuthenticated
{
    /**
     * If the user is already authenticated, redirect (for web) or return a JSON response (for API).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  ...$guards
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ...$guards)
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // API clients: return a short JSON instead of redirect loops
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'error' => [
                            'code'    => 'ALREADY_AUTHENTICATED',
                            'message' => 'You are already authenticated.',
                        ],
                    ], 409); // or 204 if you prefer
                }

                // Web flow: redirect to intended page or homepage
                return redirect()->intended(url('/'));
            }
        }

        return $next($request);
    }
}
