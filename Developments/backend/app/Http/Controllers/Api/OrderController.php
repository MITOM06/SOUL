<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $r)
    {
        $user = $r->user();
        if ($user->hasRole('admin')) {
            $orders = Order::with('items.product','user')->paginate(20);
        } else {
            $orders = $user->orders()->with('items.product')->paginate(20);
        }
        return response()->json(['success'=>true,'data'=>$orders]);
    }

    public function store(OrderRequest $request)
    {
        $user = $request->user();
        $items = $request->validated()['items'];

        DB::beginTransaction();
        try {
            $total = 0;
            $order = Order::create(['user_id'=>$user->id,'total'=>0,'status'=>'pending']);

            foreach ($items as $it) {
                $product = Product::findOrFail($it['product_id']);
                $price = $product->price;
                $qty = $it['quantity'];
                $total += $price * $qty;
                $order->items()->create([
                    'product_id'=>$product->id,
                    'price'=>$price,
                    'quantity'=>$qty,
                    'meta'=>['title'=>$product->title]
                ]);
            }

            $order->update(['total'=>$total,'status'=>'paid']); // adjust status based on your flow
            DB::commit();
            return response()->json(['success'=>true,'data'=>$order->load('items.product')],201);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json(['success'=>false,'message'=>'Could not create order'],500);
        }
    }

    public function show(Request $r, Order $order)
    {
        $user = $r->user();
        if (!$user->hasRole('admin') && $order->user_id !== $user->id) {
            return response()->json(['success'=>false,'message'=>'Unauthorized'],403);
        }
        $order->load('items.product');
        return response()->json(['success'=>true,'data'=>$order]);
    }
}
