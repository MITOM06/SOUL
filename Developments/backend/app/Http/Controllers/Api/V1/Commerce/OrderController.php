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
//     // Lấy danh sách orders
//     public function index(Request $r)
//     {
//         $user = $r->user();
//         if ($user->hasRole('admin')) {
//             $orders = Order::with('items.product', 'user')->paginate(20);
//         } else {
//             $orders = $user->orders()->with('items.product')->paginate(20);
//         }
//         return response()->json(['success' => true, 'data' => $orders]);
//     }

//     // Tạo mới một order
//     public function store(OrderRequest $request)
//     {
//         $user = $request->user();
//         $items = $request->validated()['items'];

//         DB::beginTransaction();
//         try {
//             $total = 0;
//             $order = Order::create(['user_id' => $user->id, 'total' => 0, 'status' => 'pending']);

//             foreach ($items as $it) {
//                 $product = Product::findOrFail($it['product_id']);
//                 $price = $product->price;
//                 $qty = $it['quantity'];
//                 $total += $price * $qty;
//                 $order->items()->create([
//                     'product_id' => $product->id,
//                     'price' => $price,
//                     'quantity' => $qty,
//                     'meta' => ['title' => $product->title]
//                 ]);
//             }

//             $order->update(['total' => $total, 'status' => 'paid']); // adjust status based on your flow
//             DB::commit();
//             return response()->json(['success' => true, 'data' => $order->load('items.product')], 201);
//         } catch (\Throwable $e) {
//             DB::rollBack();
//             report($e);
//             return response()->json(['success' => false, 'message' => 'Could not create order'], 500);
//         }
//     }

//     // Lấy thông tin chi tiết một order
//     public function show(Request $r, Order $order)
//     {
//         $user = $r->user();
//         if (!$user->hasRole('admin') && $order->user_id !== $user->id) {
//             return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
//         }
//         $order->load('items.product');
//         return response()->json(['success' => true, 'data' => $order]);
//     }

//     // Cập nhật thông tin order
//     public function update(Request $request, Order $order)
//     {
//         $request->validate([
//             'status' => 'string',
//             'total_amount' => 'numeric'
//         ]);

//         $order->update($request->only('status', 'total_amount'));

//         return response()->json(['success' => true, 'data' => $order->load('items')], 200);
//     }

//     // Xóa một order
//     public function destroy(Order $order)
//     {
//         $order->delete();
//         return response()->json(['success' => true, 'message' => 'Order deleted successfully'], 204);
//     }
// 
// Lấy đơn hàng pending của user (giống cart)






    // Lấy đơn hàng pending (giống cart) của user
//    public function index(Request $request)
// {
//     $user = $request->user();
//     if (!$user) {
//         return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
//     }

//     $order = Order::with('items.product')
//         ->where('user_id', $user->id)
//         ->where('status', 'pending')
//         ->first();

//     return response()->json([
//         'success' => true,
//         'data' => $order, // có thể null
//         'message' => $order ? 'Pending order found' : 'No pending order found'
//     ]);
// }

//test
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

// public function checkout(Request $request)
// {
//     $user = $request->user();
//     if (!$user) {
//         return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
//     }

//     $order = Order::with('items.product')
//         ->where('user_id', $user->id)
//         ->where('status', 'pending')
//         ->first();

//     if (!$order || $order->items->count() === 0) {
//         return response()->json([
//             'success' => false,
//             'message' => 'No pending order to checkout'
//         ], 404);
//     }

//     $order->update(['status' => 'paid']);

//     return response()->json([
//         'success' => true,
//         'message' => 'Order checked out successfully',
//         'data' => $order
//     ]);
// }

//test
public function checkout(Request $request)
{
    $user = $request->user();
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthenticated'
        ], 401);
    }

    $order = Order::with('items.product')
        ->where('user_id', $user->id)
        ->where('status', 'pending')
        ->first();

    if (!$order || $order->items->count() === 0) {
        return response()->json([
            'success' => false,
            'message' => 'No pending order to checkout'
        ], 404);
    }

    $order->update(['status' => 'paid']);

    return response()->json([
        'success' => true,
        'message' => 'Order checked out successfully',
        'data' => $order
    ]);
}

}


