<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class IdempotencyKey
{
    // Sử dụng header: Idempotency-Key
    public function handle(Request $request, Closure $next, $ttlSeconds = 120)
    {
        $key = $request->header('Idempotency-Key');
        if (!$key) {
            return response()->json([
                'error' => ['code' => 'IDEMPOTENCY_KEY_MISSING', 'message' => 'Idempotency-Key header is required.']
            ], 400);
        }

        $cacheKey = 'idempotency:' . sha1($key);
        if (Cache::has($cacheKey)) {
            // Nếu cần có response cache body, có thể lưu kết quả tại đây (advanced)
            return response()->json([
                'error' => ['code' => 'IDEMPOTENT_REPLAY', 'message' => 'Duplicate request detected.']
            ], 409);
        }

        Cache::put($cacheKey, true, now()->addSeconds((int)$ttlSeconds));
        return $next($request);
    }
}
