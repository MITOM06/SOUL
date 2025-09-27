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

use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderItemController;
use App\Http\Controllers\Api\V1\Admin\SubscriptionController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;

use App\Http\Controllers\Api\V1\Library\FavouriteController;
use App\Http\Controllers\Api\V1\Catalog\ProductReadController;
use App\Http\Controllers\Api\V1\Catalog\ProductWriteController;
use App\Http\Controllers\Api\V1\Library\ContinueLiteController;
use App\Http\Controllers\Api\V1\Library\LibraryController;
use App\Http\Controllers\Api\V1\Media\YoutubeController;

// ➕ Users Subscriptions (thêm mới)
use App\Http\Controllers\Api\V1\Users\UserSubscriptionController as UserSubController;
use App\Http\Controllers\Api\V1\Admin\UserSubscriptionController  as AdminUserSubController;

Route::get('/health', fn() => response()->json(['ok' => true, 'ts' => now()->toISOString()]));

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


    // =====================================================
    // 🔹 Routes cần login
    // =====================================================
    Route::middleware('auth:sanctum')->group(function () {
        // Authenticated user
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user',   [AuthController::class, 'getUser']);

        // Profile
        Route::get('profile',             [UserController::class, 'getProfile']);
        Route::put('profile',             [UserController::class, 'updateProfile']);
        Route::put('profile/password',    [UserController::class, 'changePassword']);

        // Favourites (User)
        Route::get('favourites',            [FavouriteController::class, 'index']);
        Route::post('favourites',           [FavouriteController::class, 'store']);
        Route::post('favourites/toggle',    [FavouriteController::class, 'toggle']);
        Route::delete('favourites/{product}', [FavouriteController::class, 'destroy']);

        // Transactions
        Route::get('transactions',     [PaymentController::class, 'listTransactions']);
        Route::get('transactions/{id}', [PaymentController::class, 'showTransaction']);

        // Orders
        Route::get('orders',               [OrderController::class, 'index']);
        Route::post('orders',              [OrderController::class, 'store']);
        Route::get('orders/{order}',       [OrderController::class, 'show']);
        Route::post('orders/checkout',     [OrderController::class, 'checkout']);

        // Cart
        Route::get('cart/count',  [OrderItemController::class, 'cartCount']);
        Route::post('cart', [OrderItemController::class, 'addToCart']);
        Route::delete('cart/{product}', [OrderItemController::class, 'removeFromCart']);

        // Order Items
        Route::post('orders/items',          [OrderItemController::class, 'store']);
        Route::put('orders/items/{itemId}', [OrderItemController::class, 'update']);
        Route::delete('orders/items/{itemId}', [OrderItemController::class, 'destroy']);

        // File download
        Route::get('products/{product}/files/{file}/download', [ProductController::class, 'downloadFile']);

        // Library
        Route::get('library', [LibraryController::class, 'index']);

        // ➕ Users Subscriptions (USER)
        Route::get('subscriptions',           [UserSubController::class, 'index']);
        Route::post('subscriptions',          [UserSubController::class, 'store']);
        Route::delete('subscriptions/{id}',   [UserSubController::class, 'destroy']);


        // ---------------- Payment public ----------------
        Route::post('payment/checkout', [PaymentController::class, 'checkout']);
        Route::post('payment/webhook',  [PaymentController::class, 'webhook']);
        Route::get('payments/{id}', [PaymentController::class, 'showTransaction']);
        Route::post('payments/{id}/confirm-otp', [PaymentController::class, 'confirmOtp'])
            ->name('payments.confirm-otp');
        Route::get('/payment-history', [PaymentController::class, 'history']);


        // Subscription checkout
        Route::post('subscriptions/checkout', [PaymentController::class, 'checkoutSubscription']);
    });

    // =====================================================
    // 🔹 Admin routes
    // =====================================================
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('stats', [AdminDashboardController::class, 'stats']);

        // Users management
        Route::apiResource('users', AdminUserController::class);

        // Products
        Route::post('products',           [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        // Orders
        Route::apiResource('orders', AdminOrderController::class);

        // Order Items
        Route::get('orders/items',        [AdminOrderItemController::class, 'index']);
        Route::get('orders/items/{item}', [AdminOrderItemController::class, 'show']);
        Route::put('orders/items/{item}', [AdminOrderItemController::class, 'update']);
        Route::delete('orders/items/{item}', [AdminOrderItemController::class, 'destroy']);

        // ➕ Users Subscriptions (ADMIN CRUD)
        Route::apiResource('users-sub', AdminUserSubController::class);

        // Payment History
        // Admin Payments
        Route::get('payments', [PaymentController::class, 'adminIndex']);
        Route::get('payments/history', [PaymentController::class, 'adminHistory']);
        Route::delete('payments/{id}', [PaymentController::class, 'adminDelete']);
    });

    // =====================================================
    // 🔹 Catalog + Media
    // =====================================================
    Route::get('catalog/products',                  [ProductReadController::class,  'index']);
    Route::get('catalog/podcast/categories',       [ProductReadController::class,  'categories']);
    Route::get('catalog/products/{id}',             [ProductReadController::class,  'show']);

    Route::post('catalog/products',                  [ProductWriteController::class, 'store']);
    Route::put('catalog/products/{id}',             [ProductWriteController::class, 'update']);
    Route::delete('catalog/products/{id}',          [ProductWriteController::class, 'destroy']);
    Route::post('catalog/products/{id}/files',      [ProductWriteController::class, 'uploadFiles']);
    Route::post('catalog/products/{id}/thumbnail',  [ProductWriteController::class, 'uploadThumbnail']);
    Route::post('catalog/products/{id}/youtube',    [ProductWriteController::class, 'attachYoutube']);
    Route::get('catalog/products/{product}/files/{file}/download', [ProductWriteController::class, 'downloadFile']);

    // Continue progress
    Route::get('continues/{product}', [ContinueLiteController::class, 'show']);
    Route::post('continues/{product}', [ContinueLiteController::class, 'store']);

    // Youtube
    Route::get('youtube/lookup', [YoutubeController::class, 'lookup']);



    // ---------------- Fallback ----------------
    Route::fallback(fn() => response()->json(['message' => 'Endpoint not found'], 404));
});
