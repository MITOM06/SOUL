<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;

class TestUserOrderSeeder extends Seeder
{
    public function run(): void
    {
        // 1️⃣ Tạo user test
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password_hash' => bcrypt('123456')
            ]
        );

        // 2️⃣ Tạo sản phẩm test nếu chưa có
        $product = Product::firstOrCreate(
            ['title' => 'Test Product'],
            [
                'price_cents' => 100,
                'slug' => Str::slug('Test Product') . '-' . time()
            ]
        );

        // 3️⃣ Tạo order pending cho user
        $order = Order::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'pending'],
            ['total_cents' => 0]
        );

        // 4️⃣ Thêm sản phẩm vào order (cart)
        $orderItem = $order->items()->firstOrCreate(
            ['product_id' => $product->id],
            [
                'unit_price_cents' => $product->price_cents,
                'quantity' => 2
            ]
        );

        // 5️⃣ Cập nhật tổng tiền order
        $order->update([
            'total_cents' => $order->items->sum(fn($i) => $i->unit_price_cents * $i->quantity)
        ]);
    }
}

