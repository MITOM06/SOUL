<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\V1\Commerce\OrderController;
use App\Http\Controllers\Api\V1\Commerce\OrderItemController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderItemController;

// Các controller còn lại giữ nguyên nếu có


Route::get('/health', fn() => response()->json(['ok' => true, 'ts' => now()->toISOString()]));

Route::prefix('v1')->group(function () {

    // Auth
    Route::post('register', [RegisterController::class, 'register']);
    Route::post('login', [LoginController::class, 'login']);

    // Auth routes 
  Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user',    [AuthController::class, 'getUser']);

        // Orders / download… các route cần login để dùng
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders/checkout', [OrderController::class, 'checkout']);
        Route::post('orders/items', [OrderItemController::class, 'store']);
        Route::put('orders/items/{itemId}', [OrderItemController::class, 'update']);
        Route::delete('orders/items/{itemId}', [OrderItemController::class, 'destroy']);
        Route::get('products/{product}/files/{file}/download', [ProductController::class, 'downloadFile']);
    });

    // Public product routes
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);

    // ...existing code...

   // Authenticated user routes
    Route::middleware('auth:sanctum')->group(function () {
       // Orders
        Route::get('orders',            [OrderController::class, 'index']);
        Route::post('orders',           [OrderController::class, 'store']);
        Route::get('orders/{order}',    [OrderController::class, 'show']);

        // Orders
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders/checkout', [OrderController::class, 'checkout']);

        // Order Items
        Route::post('orders/items', [OrderItemController::class, 'store']);       // thêm vào cart
        Route::put('orders/items/{itemId}', [OrderItemController::class, 'update']); // update số lượng
        Route::delete('orders/items/{itemId}', [OrderItemController::class, 'destroy']); // xóa khỏi cart

        // Product secured file download
        Route::get('products/{product}/files/{file}/download', [ProductController::class, 'downloadFile']);
    });
    


    // Admin routes
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        // Dashboard / stats
        Route::get('stats', [DashboardController::class, 'stats']);

        // Users management
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        // Products (write)
        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);
         
          // Orders
    Route::get('orders', [App\Http\Controllers\Api\V1\Admin\AdminOrderController::class, 'index']);
    Route::get('orders/{order}', [App\Http\Controllers\Api\V1\Admin\AdminOrderController::class, 'show']);
    Route::put('orders/{order}', [App\Http\Controllers\Api\V1\Admin\AdminOrderController::class, 'update']);
    Route::delete('orders/{order}', [App\Http\Controllers\Api\V1\Admin\AdminOrderController::class, 'destroy']);

    // Order Items
    Route::get('orders/items', [AdminOrderItemController::class, 'index']);
    Route::get('orders/items/{item}', [AdminOrderItemController::class, 'show']);
    Route::put('orders/items/{item}', [AdminOrderItemController::class, 'update']);
    Route::delete('orders/items/{item}', [AdminOrderItemController::class, 'destroy']);

        // ...existing code...
    });

    // Fallback for unknown endpoints within /v1
    Route::fallback(function () {
        return response()->json(['message' => 'Endpoint not found'], 404);
    });
 });

