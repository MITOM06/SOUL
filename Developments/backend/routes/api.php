<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\AuthController;

use App\Http\Controllers\Api\ProductController;

use App\Http\Controllers\Api\V1\Commerce\OrderController;
use App\Http\Controllers\Api\V1\Commerce\OrderItemController;
use App\Http\Controllers\Api\V1\Commerce\PaymentController;

use App\Http\Controllers\Api\V1\Users\UserController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderItemController;

use App\Http\Controllers\Api\V1\Admin\SubscriptionController;

use App\Http\Controllers\Api\V1\Library\FavouriteController;
use App\Http\Controllers\Api\V1\Catalog\ProductReadController;
use App\Http\Controllers\Api\V1\Catalog\ProductWriteController;
use App\Http\Controllers\Api\V1\Library\ContinueLiteController;
use App\Http\Controllers\Api\V1\Media\YoutubeController;

// ➕ Users Subscriptions (thêm mới)
use App\Http\Controllers\Api\V1\Users\UserSubscriptionController as UserSubController;
use App\Http\Controllers\Api\V1\Admin\UserSubscriptionController  as AdminUserSubController;

Route::get('/health', fn () => response()->json(['ok' => true, 'ts' => now()->toISOString()]));

// =====================================================
// 🔹 API v1
// =====================================================
Route::prefix('v1')->group(function () {

    // ---------------- Auth (public) ----------------
    Route::post('register', [RegisterController::class, 'register']);
    Route::post('login',    [LoginController::class,   'login']);

    // ---------------- Public Products ----------------
    Route::get('products',           [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);

    // ---------------- Payment public ----------------
    Route::post('payment/checkout',      [PaymentController::class, 'checkout']);
    Route::post('payment/webhook',       [PaymentController::class, 'webhook']);
    Route::get ('payments/{id}/auto-success', [PaymentController::class, 'autoSuccess'])
        ->name('payments.auto-success');

    // =====================================================
    // 🔹 Routes cần login
    // =====================================================
    Route::middleware('auth:sanctum')->group(function () {
        // Authenticated user
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get ('user',   [AuthController::class, 'getUser']);

        // Profile
        Route::get ('profile',             [UserController::class, 'getProfile']);
        Route::put ('profile',             [UserController::class, 'updateProfile']);
        Route::put ('profile/password',    [UserController::class, 'changePassword']);

        // Favourites
        Route::get   ('favourites',               [FavouriteController::class, 'index']);
        Route::post  ('favourites',               [FavouriteController::class, 'store']);
        Route::post  ('favourites/toggle',        [FavouriteController::class, 'toggle']);
        Route::delete('favourites/{product}',     [FavouriteController::class, 'destroy']);

        // Transactions
        Route::get('transactions',     [PaymentController::class, 'listTransactions']);
        Route::get('transactions/{id}',[PaymentController::class, 'showTransaction']);

        // Orders
        Route::get ('orders',               [OrderController::class, 'index']);
        Route::post('orders',               [OrderController::class, 'store']);
        Route::get ('orders/{order}',       [OrderController::class, 'show']);
        Route::post('orders/checkout',      [OrderController::class, 'checkout']);

        // Cart
        Route::get('cart',        [OrderController::class,   'getCart']);
        Route::get('cart/count',  [OrderItemController::class,'cartCount']);

        // Order Items
        Route::post  ('orders/items',          [OrderItemController::class, 'store']);
        Route::put   ('orders/items/{itemId}', [OrderItemController::class, 'update']);
        Route::delete('orders/items/{itemId}', [OrderItemController::class, 'destroy']);

        // File download
        Route::get('products/{product}/files/{file}/download', [ProductController::class, 'downloadFile']);

        // =====================================================
        // ➕ Users Subscriptions (USER) – dùng cho người dùng đang đăng nhập
        // =====================================================
        Route::get   ('subscriptions',           [UserSubController::class, 'index']);   // list sub của chính user
        Route::post  ('subscriptions',           [UserSubController::class, 'store']);   // tạo sub: { plan: basic|standard|premium }
        Route::delete('subscriptions/{id}',      [UserSubController::class, 'destroy']); // huỷ sub của chính user
    });

    // =====================================================
    // 🔹 Admin routes
    // =====================================================
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        // Dashboard / stats
        Route::get('stats', [DashboardController::class, 'stats']);

        // Users management
        Route::get   ('users',       [AdminUserController::class, 'index']);
        Route::get   ('users/{user}',[AdminUserController::class, 'show']);
        Route::post  ('users',       [AdminUserController::class, 'store']);
        Route::put   ('users/{user}',[AdminUserController::class, 'update']);
        Route::delete('users/{user}',[AdminUserController::class, 'destroy']);

        // Products
        Route::post  ('products',           [ProductController::class, 'store']);
        Route::put   ('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        // Orders
        Route::get   ('orders',        [AdminOrderController::class, 'index']);
        Route::get   ('orders/{order}',[AdminOrderController::class, 'show']);
        Route::put   ('orders/{order}',[AdminOrderController::class, 'update']);
        Route::delete('orders/{order}',[AdminOrderController::class, 'destroy']);

        // Subscriptions (plan/catalog of subs) – đã có sẵn
        Route::get   ('subscriptions',       [SubscriptionController::class, 'index']);
        Route::get   ('subscriptions/{id}',  [SubscriptionController::class, 'show']);
        Route::post  ('subscriptions',       [SubscriptionController::class, 'store']);
        Route::put   ('subscriptions/{id}',  [SubscriptionController::class, 'update']);
        Route::delete('subscriptions/{id}',  [SubscriptionController::class, 'destroy']);

        // Order Items
        Route::get   ('orders/items',        [AdminOrderItemController::class, 'index']);
        Route::get   ('orders/items/{item}', [AdminOrderItemController::class, 'show']);
        Route::put   ('orders/items/{item}', [AdminOrderItemController::class, 'update']);
        Route::delete('orders/items/{item}', [AdminOrderItemController::class, 'destroy']);

        // =====================================================
        // ➕ Users Subscriptions (ADMIN CRUD) – quản trị bảng user_subscriptions
        // =====================================================
        Route::get   ('users-sub',          [AdminUserSubController::class, 'index']);  // list tất cả
        Route::get   ('users-sub/{id}',     [AdminUserSubController::class, 'show']);   // chi tiết
        Route::post  ('users-sub',          [AdminUserSubController::class, 'store']);  // tạo
        Route::put   ('users-sub/{id}',     [AdminUserSubController::class, 'update']); // sửa
        Route::delete('users-sub/{id}',     [AdminUserSubController::class, 'destroy']);// xoá
    });

    // =====================================================
    // 🔹 Catalog + Media
    // =====================================================
    Route::get   ('catalog/products',                  [ProductReadController::class,  'index']);
    Route::get   ('catalog/products/{id}',             [ProductReadController::class,  'show']);

    Route::post  ('catalog/products',                  [ProductWriteController::class, 'store']);
    Route::put   ('catalog/products/{id}',             [ProductWriteController::class, 'update']);
    Route::delete('catalog/products/{id}',             [ProductWriteController::class, 'destroy']);
    Route::post  ('catalog/products/{id}/files',       [ProductWriteController::class, 'uploadFiles']);
    Route::post  ('catalog/products/{id}/thumbnail',   [ProductWriteController::class, 'uploadThumbnail']);
    Route::get   ('catalog/products/{product}/files/{file}/download', [ProductWriteController::class, 'downloadFile']);

    // Continue progress
    Route::get ('continues/{product}', [ContinueLiteController::class, 'show']);
    Route::post('continues/{product}', [ContinueLiteController::class, 'store']);

    // Youtube
    Route::get('youtube/lookup', [YoutubeController::class, 'lookup']);

    // ---------------- Fallback ----------------
    Route::fallback(fn () => response()->json(['message' => 'Endpoint not found'], 404));
});
