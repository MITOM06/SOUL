<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Payment;
use App\Models\Order;
use App\Models\Product;
use App\Models\OrderItem;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // Xoá user cũ nếu tồn tại
        $user = User::where('email', 'user@example.com')->first();

        if ($user) {
            $user->orders()->delete();
            $user->payments()->delete();
            $user->delete();
        }

        // Tạo user mới
        $user = User::create([
            'email'        => 'user@example.com',
            'password_hash'=> Hash::make('password123'),
            'role'         => 'user',
            'name'         => 'Test User',
            'is_active'    => true,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // 👉 Tạo order cho user này
        $order = Order::create([
            'user_id'        => $user->id,
            'total_cents'    => 100000,
            'status'         => 'pending',
            'payment_method' => 'momo',
        ]);

        // 👉 Tạo order item gắn với sản phẩm bất kỳ
        $product = Product::inRandomOrder()->first();
        if ($product) {
            OrderItem::create([
                'order_id'   => $order->id,
                'product_id' => $product->id,
                'unit_price_cents'=> $product->price_cents ?? 50000,
                'quantity'   => 1,
            ]);
        }

        // 👉 Tạo payment gắn với order
        Payment::create([
            'order_id'      => $order->id,
            'user_id'       => $user->id,
            'provider'      => 'momo',
            'amount_cents'  => $order->total_cents,
            'currency'      => 'VND',
            'status'        => Payment::STATUS_INITIATED,
        ]);
    }
}