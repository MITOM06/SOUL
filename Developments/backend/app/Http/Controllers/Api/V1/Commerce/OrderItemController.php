<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

class OrderItemController extends Controller
{
    // ➡️ Thêm item vào giỏ
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'nullable|integer|min:1'
        ]);

        $qty = $request->input('quantity', 1);
        $product = Product::findOrFail($request->product_id);

        // 👉 Lấy order "pending" hoặc tạo mới
        $order = Order::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'pending'],
            ['total_cents' => 0]
        );

        // 👉 Kiểm tra item đã tồn tại chưa (chỉ cho phép mỗi sản phẩm 1 lần)
        $item = $order->items()->where('product_id', $product->id)->first();
        $already = false;
        if ($item) {
            // Giữ quantity = 1 cố định
            if ((int)$item->quantity !== 1) {
                $item->quantity = 1;
                $item->save();
            }
            $already = true;
        } else {
            $item = $order->items()->create([
                'product_id'       => $product->id,
                'quantity'         => 1, // cố định 1
                'unit_price_cents' => $product->price_cents,
                'meta'             => ['title' => $product->title],
            ]);
        }

        // 👉 Cập nhật tổng tiền
        $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => $already ? 'Item already in cart' : 'Item added to cart',
            'already_in_cart' => $already,
            'data'    => $order->load('items.product'),
        ]);
    }

    // ➡️ Cập nhật số lượng
    public function update(Request $request, $itemId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $item = OrderItem::find($itemId);
        if (!$item || $item->order->user_id !== $user->id || $item->order->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        // Bỏ qua thay đổi số lượng: luôn cố định 1
        if ((int)$item->quantity !== 1) {
            $item->quantity = 1;
            $item->save();
        }

        $order = $item->order;
        $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Quantity is fixed to 1',
            'data'    => $item->load('product')
        ]);
    }

    // ➡️ Xoá item
    public function destroy(Request $request, $itemId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $item = OrderItem::find($itemId);
        if (!$item || $item->order->user_id !== $user->id || $item->order->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        $order = $item->order;
        $item->delete();

        if ($order->items()->count() > 0) {
            $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
            $order->save();
        } else {
            $order->delete(); // 👉 xoá luôn order rỗng
        }

        return response()->json([
            'success' => true,
            'message' => 'Item removed from pending order',
            'data'    => $order?->load('items.product')
        ]);
    }

    // ➡️ Đếm số lượng trong giỏ (order pending)
    public function cartCount(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['count' => 0]);
        }

        $order = Order::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        $count = $order ? $order->items()->sum('quantity') : 0;

        return response()->json(['count' => $count]);
    }
}
