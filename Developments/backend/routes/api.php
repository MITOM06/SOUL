<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;

Route::prefix('v1')->group(function () {
    // Public
    Route::post('register', [AuthController::class,'register']);
    Route::post('login', [AuthController::class,'login']);

    Route::get('categories', [CategoryController::class,'index']);
    Route::get('categories/{category}', [CategoryController::class,'show']);
    Route::get('products', [ProductController::class,'index']);
    Route::get('products/{product}', [ProductController::class,'show']);

    // Protected
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class,'logout']);
        Route::get('me', [AuthController::class,'me']);
        Route::post('upload', [FileController::class,'upload']);
        Route::apiResource('orders', OrderController::class)->only(['index','store','show']);

        // Admin protected
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::apiResource('products', ProductController::class)->except(['index','show']);
            Route::apiResource('categories', CategoryController::class)->only(['store','update','destroy']);
            Route::apiResource('users', UserController::class);
            Route::get('stats', [DashboardController::class,'stats']);
        });
    });
});
