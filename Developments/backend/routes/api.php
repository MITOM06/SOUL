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
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderItemController;

Route::get('/health', fn() => response()->json(['ok' => true, 'ts' => now()->toISOString()]));

Route::prefix('v1')->group(function () {
    // 🔹 Auth (public)
    Route::post('register', [RegisterController::class, 'register']);
    Route::post('login', [LoginController::class, 'login']);

    // 🔹 Public products
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);

    // 🔹 Payment public
    Route::post('payment/checkout', [PaymentController::class, 'checkout']);
    Route::post('payment/webhook', [PaymentController::class, 'webhook']);
    Route::get('payments/{id}/auto-success', [PaymentController::class, 'autoSuccess'])
        ->name('payments.auto-success');

    // =====================================================
    // 🔹 Routes cần login
    // =====================================================
    Route::middleware('auth:sanctum')->group(function () {
        // Authenticated user
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'getUser']);

        // Profile
        Route::get('profile', [UserController::class, 'getProfile']);
        Route::put('profile', [UserController::class, 'updateProfile']);
        Route::put('profile/password', [UserController::class, 'changePassword']);

        // Transactions
        Route::get('transactions', [PaymentController::class, 'listTransactions']);
        Route::get('transactions/{id}', [PaymentController::class, 'showTransaction']);

        // Orders
        Route::get('orders', [OrderController::class, 'index']);   // danh sách
        Route::post('orders', [OrderController::class, 'store']); // tạo đơn
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::post('orders/checkout', [OrderController::class, 'checkout']); // checkout chính thức

        // Cart
        Route::get('cart', [OrderController::class, 'getCart']);
        Route::get('cart/count', [OrderItemController::class, 'cartCount']);

        // Order Items
        Route::post('orders/items', [OrderItemController::class, 'store']);
        Route::put('orders/items/{itemId}', [OrderItemController::class, 'update']);
        Route::delete('orders/items/{itemId}', [OrderItemController::class, 'destroy']);

        // File download
        Route::get('products/{product}/files/{file}/download', [ProductController::class, 'downloadFile']);
    });

    // =====================================================
    // 🔹 Admin routes
    // =====================================================
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('stats', [DashboardController::class, 'stats']);

        // Users (sau này có thể tách Admin\UserController)
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        // Products
        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        // Orders
        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show']);
        Route::put('orders/{order}', [AdminOrderController::class, 'update']);
        Route::delete('orders/{order}', [AdminOrderController::class, 'destroy']);

        // Order Items
        Route::get('orders/items', [AdminOrderItemController::class, 'index']);
        Route::get('orders/items/{item}', [AdminOrderItemController::class, 'show']);
        Route::put('orders/items/{item}', [AdminOrderItemController::class, 'update']);
        Route::delete('orders/items/{item}', [AdminOrderItemController::class, 'destroy']);
    });

    // 🔹 Fallback
    Route::fallback(fn() => response()->json(['message' => 'Endpoint not found'], 404));
});
