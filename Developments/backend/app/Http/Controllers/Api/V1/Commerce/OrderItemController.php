<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

class OrderItemController extends Controller
{
    // Thêm item vào order (cart)
    // public function store(Request $request)
    // {
    //     $user = $request->user();
    //     if (!$user) {
    //         return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
    //     }

    //     $request->validate([
    //         'product_id' => 'required|exists:products,id',
    //         'quantity' => 'required|integer|min:1'
    //     ]);

    //     $product = Product::findOrFail($request->product_id);

    //     // Lấy order pending hoặc tạo mới
    //     $order = Order::firstOrCreate(
    //         ['user_id' => $user->id, 'status' => 'pending'],
    //         ['total_cents' => 0]
    //     );

    //     // Nếu item đã tồn tại trong order thì cộng dồn
    //     $item = $order->items()->where('product_id', $product->id)->first();
    //     if ($item) {
    //         $item->quantity += $request->quantity;
    //         $item->save();
    //     } else {
    //         $order->items()->create([
    //             'product_id' => $product->id,
    //             'quantity' => $request->quantity,
    //             'unit_price_cents' => $product->price_cents,
    //             'meta' => ['title' => $product->title]
    //         ]);
    //     }

    //     // Cập nhật tổng tiền order
    //     $order->refresh();
    //     $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
    //     $order->save();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Item added to order',
    //         'data' => $order->load('items.product')
    //     ]);
    // }

//test

public function store(Request $request)
{
    // $user = $request->user();
    // if (!$user) { ... } // bỏ tạm

    $userId = 1; // ID user có sẵn trong DB

    $request->validate([
        'product_id' => 'required|exists:products,id',
        'quantity' => 'required|integer|min:1'
    ]);

    $product = Product::findOrFail($request->product_id);

    // Lấy order pending hoặc tạo mới
    $order = Order::firstOrCreate(
        ['user_id' => $userId, 'status' => 'pending'],
        ['total_cents' => 0]
    );

    $item = $order->items()->where('product_id', $product->id)->first();
    if ($item) {
        $item->quantity += $request->quantity;
        $item->save();
    } else {
        $order->items()->create([
            'product_id' => $product->id,
            'quantity' => $request->quantity,
            'unit_price_cents' => $product->price_cents,
            'meta' => ['title' => $product->title]
        ]);
    }

    $order->refresh();
    $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
    $order->save();

    return response()->json([
        'success' => true,
        'message' => 'Item added to order',
        'data' => $order->load('items.product')
    ]);
}

    // // Cập nhật số lượng item
    // public function update(Request $request, $itemId)
    // {
    //     $request->validate([
    //         'quantity' => 'required|integer|min:1'
    //     ]);

    //     $item = OrderItem::find($itemId);
    //     if (!$item) {
    //         return response()->json(['success' => false, 'message' => 'Item not found'], 404);
    //     }

    //     $item->quantity = $request->quantity;
    //     $item->save();

    //     $order = $item->order;
    //     if ($order) {
    //         $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
    //         $order->save();
    //     }

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Item updated',
    //         'data' => $item->load('product')
    //     ]);
    // }

    //test
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
        'data' => $item->load('product')
    ]);
}

    // // Xóa item khỏi order
    // public function destroy($itemId)
    // {
    //     $item = OrderItem::find($itemId);
    //     if (!$item) {
    //         return response()->json(['success' => false, 'message' => 'Item not found'], 404);
    //     }

    //     $order = $item->order;
    //     $item->delete();

    //     if ($order) {
    //         $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
    //         $order->save();
    //     }

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Item removed from order',
    //         'data' => $order?->load('items.product') // null-safe
    //     ]);
    // }

    //test
   public function destroy($itemId)
{
    $item = OrderItem::find($itemId);
    if (!$item) {
        return response()->json(['success' => false, 'message' => 'Item not found'], 404);
    }

    $order = $item->order;
    $item->delete();

    // Nếu order còn item thì cập nhật tổng, nếu rỗng thì xoá luôn order
    if ($order) {
        if ($order->items()->count() > 0) {
            $order->total_cents = $order->items->sum(fn($i) => $i->quantity * $i->unit_price_cents);
            $order->save();
        } else {
            $order->delete(); // xoá luôn order
            $order = null;    // set null để frontend không hiển thị
        }
    }

    return response()->json([
        'success' => true,
        'message' => 'Item removed from order',
        'data' => $order?->load('items.product') // null-safe
    ]);
}
}
