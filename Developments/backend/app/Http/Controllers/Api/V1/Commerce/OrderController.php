<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

class OrderController extends Controller
{
    /**
     * Lấy order pending của user hiện tại
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $order = Order::with('items.product')
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => $order,
            'message' => $order ? 'Pending order found' : 'No pending order found',
        ]);
    }

    /**
     * Thêm sản phẩm vào giỏ (order pending)
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id'     => 'required|exists:products,id',
            'quantity'       => 'nullable|integer|min:1',
            'payment_method' => 'nullable|string',
        ]);

        $user = $request->user();
        $qty  = (int) $request->input('quantity', 1);

        // Tìm hoặc tạo order pending
        $order = $user->orders()->firstOrCreate(
            ['status' => 'pending'],
            ['payment_method' => $request->input('payment_method', 'cod'), 'total_cents' => 0]
        );

        // Tìm item trong order
        $item = $order->items()->where('product_id', $request->product_id)->first();

        $item
            ? $item->increment('quantity', $qty)
            : $order->items()->create(['product_id' => $request->product_id, 'quantity' => $qty]);

        // Tính lại tổng
        $order->recalculateTotal();
        $order->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Product added to cart',
            'order'   => $order->load('items.product'),
        ]);
    }

    /**
     * Checkout → gọi PaymentController để tạo QR + OTP
     */
    public function checkout(Request $request)
    {
        $request->validate(['order_id' => 'required|exists:orders,id']);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', auth()->id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Gọi PaymentController
        return app(PaymentController::class)->checkout($request);
    }

    /**
     * Xem chi tiết order
     */
    public function show(Request $request, $orderId)
    {
        $order = Order::with('items.product')
            ->where('id', $orderId)
            ->where('user_id', $request->user()?->id)
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $order]);
    }
}
