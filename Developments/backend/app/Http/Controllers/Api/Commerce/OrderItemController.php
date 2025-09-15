<?php

namespace App\Http\Controllers\Api\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

class OrderItemController extends Controller
{
    // Thêm item vào order (cart)
    public function store(Request $request)
    {
        $user = $request->user();

        // Lấy order pending của user hoặc tạo mới
        $order = Order::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'pending'],
            ['total' => 0]
        );

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($request->product_id);

        // Nếu item đã tồn tại trong order thì cộng dồn
        $item = $order->items()->where('product_id', $product->id)->first();
        if ($item) {
            $item->quantity += $request->quantity;
            $item->save();
        } else {
            $order->items()->create([
                'product_id' => $product->id,
                'quantity' => $request->quantity,
                'price' => $product->price,
                'meta' => ['title' => $product->title]
            ]);
        }

        // Cập nhật tổng tiền order
        $order->refresh(); // load lại items
        $order->total = $order->items->sum(fn($i) => $i->quantity * $i->price);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Item added to order',
            'data' => $order->load('items.product')
        ]);
    }

    // Cập nhật số lượng item
    public function update(Request $request, $itemId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $item = OrderItem::findOrFail($itemId);
        $item->quantity = $request->quantity;
        $item->save();

        // Cập nhật tổng tiền order
        $order = $item->order;
        $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Item updated',
            'data' => $item->load('product')
        ]);
    }

    // Xóa item khỏi order
    public function destroy($itemId)
    {
        $item = OrderItem::findOrFail($itemId);
        $order = $item->order;
        $item->delete();

        // Cập nhật tổng tiền order
        $order->total = $order->items->sum(fn($i) => $i->quantity * $i->price);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from order',
            'data' => $order->load('items.product')
        ]);
    }
}
