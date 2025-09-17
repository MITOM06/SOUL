<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    /**
     * Lấy danh sách tất cả orders (có thể filter theo status, user_id).
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'items.product'])->latest();

        // filter theo user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // filter theo status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->get();

        return response()->json([
            'data' => $orders
        ]);
    }

    /**
     * Xem chi tiết 1 order cụ thể.
     */
    public function show(Order $order)
    {
        $order->load(['user', 'items.product']);

        return response()->json([
            'data' => $order
        ]);
    }

    /**
     * Cập nhật thông tin order (ví dụ: status).
     */
    public function update(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|string|in:pending,paid,cancelled,refunded',
        ]);

        $order->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Order updated successfully',
            'data' => $order->load(['user', 'items.product']),
        ]);
    }

    /**
     * Xoá một order (xoá luôn cả items vì có cascade).
     */
    public function destroy(Order $order)
    {
        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully'
        ]);
    }
}
