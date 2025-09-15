<?php

namespace App\Http\Middleware;

use App\Models\Order;
use Closure;
use Illuminate\Http\Request;

class EnsureOrderOwner
{
    public function handle(Request $request, Closure $next)
    {
        $orderId = (int) ($request->route('order') ?? 0);
        $order = Order::find($orderId);
        $user  = $request->user();

        // Admin thì pass, còn lại phải đúng chủ sở hữu
        $isAdmin = $user && (($user->role ?? null) === 'admin' || (method_exists($user, 'hasRole') && $user->hasRole('admin')));
        if (!$order || (!$isAdmin && $order->user_id !== $user->id)) {
            return response()->json([
                'error' => ['code' => 'ORDER_FORBIDDEN', 'message' => 'You do not have access to this order.']
            ], 403);
        }
        return $next($request);
    }
}
