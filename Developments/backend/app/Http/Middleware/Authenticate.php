<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Where to redirect users if they are not authenticated (for non-API requests).
     * For API requests, Laravel will return 401 JSON automatically if the client
     * sends "Accept: application/json" or it's under /api/*.
     */
    protected function redirectTo(Request $request): ?string
    {
        if (! $request->expectsJson() && ! $request->is('api/*')) {
            // If you have a named route('login'), you can return route('login') instead.
            return url('/login');
        }

        // For API requests, return null so framework can produce 401 JSON.
        return null;
    }
}
