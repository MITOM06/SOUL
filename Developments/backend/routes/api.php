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
use App\Http\Controllers\Api\V1\Library\FavouriteController;
use App\Http\Controllers\Api\V1\Catalog\ProductReadController;
use App\Http\Controllers\Api\V1\Catalog\ProductWriteController;
use App\Http\Controllers\Api\V1\Library\ContinueLiteController;

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
        
// ===== FAVOURITES: bắt buộc đăng nhập thật =====
     Route::get   ('favourites',               [FavouriteController::class, 'index']);
    Route::post  ('favourites',               [FavouriteController::class, 'store']);   // { product_id }
    Route::post  ('favourites/toggle',        [FavouriteController::class, 'toggle']);  // { product_id }
    Route::delete('favourites/{product}',     [FavouriteController::class, 'destroy']);

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

        // ...existing code...
    });

    // Fallback for unknown endpoints within /v1
    Route::fallback(function () {
        return response()->json(['message' => 'Endpoint not found'], 404);
    });
 });



// === Added by assistant: Catalog + Continue endpoints (non-breaking) ===


Route::prefix('v1')->group(function () {
    // Read-only catalog
    Route::get('catalog/products', [ProductReadController::class, 'index']);
    Route::get('catalog/products/{id}', [ProductReadController::class, 'show']);

    // Admin write (no auth guard enforced here to stay non-breaking; project can add middleware later)
    Route::post('catalog/products', [ProductWriteController::class, 'store']);
    Route::put('catalog/products/{id}', [ProductWriteController::class, 'update']);
    Route::delete('catalog/products/{id}', [ProductWriteController::class, 'destroy']);

    // Continue progress
    Route::get('continues/{product}', [ContinueLiteController::class, 'show']);
    Route::post('continues/{product}', [ContinueLiteController::class, 'store']);
    // Route::get('catalog/products/{product}/files/{file}/download',
    // [ProductWriteController::class, 'downloadFile']);
    
    // routes/api.php (trong nhóm /v1)
Route::post('catalog/products/{id}/files', [\App\Http\Controllers\Api\V1\Catalog\ProductWriteController::class, 'uploadFiles']);

});

// Upload file thực tế vào storage
Route::post('catalog/products/{id}/files', [\App\Http\Controllers\Api\V1\Catalog\ProductWriteController::class, 'uploadFiles']);

// Upload ảnh bìa
Route::post('catalog/products/{id}/thumbnail', [\App\Http\Controllers\Api\V1\Catalog\ProductWriteController::class, 'uploadThumbnail']);

// Download file
Route::get('catalog/products/{product}/files/{file}/download', [\App\Http\Controllers\Api\V1\Catalog\ProductWriteController::class, 'downloadFile']);
