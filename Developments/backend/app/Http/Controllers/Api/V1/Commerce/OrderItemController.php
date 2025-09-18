<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderItemController extends Controller
{
    // 👉 Thêm sản phẩm vào giỏ
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($request->product_id);

        // Order trạng thái "pending" (giỏ hàng chưa thanh toán)
        $order = Order::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'pending'],
            ['total_cents' => 0]
        );

        // Nếu sản phẩm đã có trong giỏ → cộng dồn
        $item = $order->items()->where('product_id', $product->id)->first();
        if ($item) {
            $item->quantity += $request->quantity;
            $item->save();
        } else {
            $order->items()->create([
                'product_id'       => $product->id,
                'quantity'         => $request->quantity,
                'unit_price_cents' => $product->price_cents,
                'meta'             => ['title' => $product->title]
            ]);
        }

        // Update tổng tiền
        $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Item added to cart',
            'data'    => $order->load('items.product')
        ]);
    }

    // 👉 Cập nhật số lượng sản phẩm
    public function update(Request $request, $itemId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $item = OrderItem::find($itemId);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        $item->quantity = $request->quantity;
        $item->save();

        $order = $item->order;
        if ($order) {
            $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
            $order->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Item updated',
            'data'    => $item->load('product')
        ]);
    }

    // 👉 Xóa sản phẩm khỏi giỏ
    public function destroy($itemId)
    {
        $item = OrderItem::find($itemId);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        $order = $item->order;
        $item->delete();

        if ($order) {
            if ($order->items()->count() > 0) {
                $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
                $order->save();
            } else {
                $order->delete();
                $order = null;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Item removed from cart',
            'data'    => $order?->load('items.product')
        ]);
    }

    // 👉 Đếm số lượng sản phẩm trong giỏ
    public function cartCount(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['count' => 0]);
        }

        $count = OrderItem::whereHas('order', function($q) use ($user) {
            $q->where('user_id', $user->id)
              ->where('status', 'pending');
        })->sum('quantity');

        return response()->json(['count' => $count]);
    }
}
