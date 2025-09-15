<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json(['success'=>true,'data'=>[
            'users' => User::count(),
            'products' => Product::count(),
            'orders' => Order::count(),
            'revenue' => Order::sum('total')
        ]]);
    }
}
