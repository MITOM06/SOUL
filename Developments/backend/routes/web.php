<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Fallback static serving for public storage when symbolic link is missing
Route::get('/storage/{path}', function (string $path) {
    // Only allow known public subpaths
    $allowed = ['books/thumbnail', 'books/Content', 'podcasts/thumbnail', 'products'];
    foreach ($allowed as $prefix) {
        if (Str::startsWith($path, $prefix)) {
            $full = storage_path('app/public/' . $path);
            if (is_file($full)) {
                return response()->file($full);
            }
            abort(404);
        }
    }
    abort(404);
})->where('path', '.*');
