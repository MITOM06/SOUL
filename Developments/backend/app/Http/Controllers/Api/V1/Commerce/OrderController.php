<?php


namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\User; // Để sử dụng model User

// use App\Models\Product; // Để sử dụng model Product
// use App\Http\Requests\OrderRequest; // Để sử dụng OrderRequest nếu có
// use Illuminate\Support\Facades\DB; // Để sử dụng DB


class OrderController extends Controller
{

public function index(Request $request)
{
    $user = $request->user();
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated'
        ], 401);
    }

    $order = Order::with('items.product')
        ->where('user_id', $user->id)   // 👈 lấy đúng user đang đăng nhập
        ->where('status', 'pending')
        ->first();

    return response()->json([
        'success' => true,
        'data' => $order,
        'message' => $order ? 'Pending order found' : 'No pending order found'
    ]);
}

public function store(Request $request)
{
    $request->validate([
        'product_id'   => 'required|exists:products,id',
        'quantity'     => 'nullable|integer|min:1',
        'payment_method' => 'nullable|string'
    ]);

    $user = $request->user();
    $qty = $request->input('quantity', 1);

    // 👉 Tìm hoặc tạo order status = 'pending'
    $order = $user->orders()->firstOrCreate(
        ['status' => 'pending'],
        ['payment_method' => $request->input('payment_method', 'cod'), 'total_cents' => 0]
    );

    // 👉 Thêm/Update item
    $item = $order->items()->updateOrCreate(
        ['product_id' => $request->product_id],
        ['quantity' => \DB::raw("quantity + $qty")]
    );

    // 👉 Recalculate total
    if (method_exists($order, 'recalculateTotal')) {
        $order->recalculateTotal();
    }

    return response()->json([
        'success' => true,
        'message' => 'Product added to cart',
        'order'   => $order->load('items.product'),
    ]);
}
//test
public function checkout(Request $request)
{
    $orderId = $request->input('order_id');

    $order = Order::where('id', $orderId)
        ->where('user_id', auth()->id())
        ->firstOrFail();

    // update trạng thái
    $order->status = 'paid';
    $order->save();

    return response()->json([
        'success' => true,
        'message' => 'Thanh toán thành công',
        'order'   => $order,
    ]);
}




}


