<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderItemController extends Controller
{
    /**
     * Danh sách tất cả order items (có thể filter theo order_id nếu cần).
     */
    public function index(Request $request)
    {
        $query = OrderItem::with(['order.user', 'product'])->latest();

        if ($request->has('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        $items = $query->get();

        return response()->json([
            'data' => $items
        ]);
    }

    /**
     * Xem chi tiết 1 order item.
     */
    public function show(OrderItem $item)
    {
        $item->load(['order.user', 'product']);

        return response()->json([
            'data' => $item
        ]);
    }

    /**
     * Admin có thể cập nhật số lượng item trong order.
     */
    public function update(Request $request, OrderItem $item)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $item->update([
            'quantity' => $request->quantity
        ]);

        $this->recalcOrderTotal($item->order_id);

        return response()->json([
            'message' => 'Order item updated successfully',
            'data' => $item->load(['order.user', 'product']),
        ]);
    }

    /**
     * Xoá một order item.
     */
    public function destroy(OrderItem $item)
    {
        $orderId = $item->order_id;

        $item->delete();

        $this->recalcOrderTotal($orderId);

        return response()->json([
            'message' => 'Order item deleted successfully'
        ]);
    }

    /**
     * Hàm nội bộ để tính lại tổng tiền của Order.
     */
    protected function recalcOrderTotal($orderId)
{
    $order = Order::with('items')->find($orderId);

    if (!$order) {
        return;
    }

    // đảm bảo luôn là Collection
    $items = collect($order->items);

    $total = $items->sum(function ($item) {
        return $item->unit_price_cents * $item->quantity;
    });

    $order->update(['total_cents' => $total]);
}
}
