<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * Global HTTP middleware (chạy cho mọi request).
     *
     * @var array<int, class-string|string>
     */
    protected $middleware = [
        // \App\Http\Middleware\TrustHosts::class,
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * Route middleware groups.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        // API: dùng Sanctum cho SPA/Next.js cùng domain; throttle & bindings tiêu chuẩn
        'api' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * Middleware aliases (gán tên ngắn để dùng trong routes).
     *
     * @var array<string, class-string|string>
     */
    protected $middlewareAliases = [
        'auth'              => \App\Http\Middleware\Authenticate::class,
        'auth.basic'        => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'auth.session'      => \Illuminate\Session\Middleware\AuthenticateSession::class,
        'cache.headers'     => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can'               => \Illuminate\Auth\Middleware\Authorize::class,
        'guest'             => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm'  => \Illuminate\Auth\Middleware\RequirePassword::class,
        'precognitive'      => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        'signed'            => \App\Http\Middleware\ValidateSignature::class,
        'throttle'          => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified'          => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,

        // === Aliases bạn cần dùng cho dự án ===
        'active'            => \App\Http\Middleware\EnsureActiveUser::class,     // chặn user bị inactive
        'admin'             => \App\Http\Middleware\EnsureIsAdmin::class,        // chặn non-admin
        'order.owner'       => \App\Http\Middleware\EnsureOrderOwner::class,     // chỉ chủ đơn hoặc admin mới được xem/sửa
        'idempotency'       => \App\Http\Middleware\IdempotencyKey::class,       // chống double-charge payments
    ];
}
