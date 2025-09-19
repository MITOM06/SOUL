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

        // 👉 Kiểm tra item đã tồn tại chưa
        $item = $order->items()->where('product_id', $product->id)->first();

        if ($item) {
            $item->quantity += $qty;
            $item->save();
        } else {
            $item = $order->items()->create([
                'product_id'       => $product->id,
                'quantity'         => $qty,
                'unit_price_cents' => $product->price_cents,
                'meta'             => ['title' => $product->title],
            ]);
        }

        // 👉 Cập nhật tổng tiền
        $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Item added to pending order',
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

        $item->quantity = $request->quantity;
        $item->save();

        $order = $item->order;
        $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Item updated',
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
