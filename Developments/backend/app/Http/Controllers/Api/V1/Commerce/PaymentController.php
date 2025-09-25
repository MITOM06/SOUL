<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Checkout – tạo payment (không OTP trong DB, chỉ giả lập).
     * Ràng buộc: order phải thuộc về user hiện tại và còn hiệu lực.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'provider' => 'required|string',
        ]);

        $user = $request->user();
        $order = Order::with(['items.product'])->findOrFail($request->order_id);

        // Chỉ owner được checkout
        if (!$user || (int) $order->user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized order'], 403);
        }

        // Tuỳ mô hình của bạn có status/order_state... ở đây chỉ kiểm tra đơn giản
        if (method_exists($order, 'isPayable') && !$order->isPayable()) {
            return response()->json(['success' => false, 'message' => 'Order not payable'], 400);
        }

        $payment = Payment::create([
            'order_id'     => $order->id,
            'user_id'      => $user->id,
            'provider'     => $request->provider,
            'amount_cents' => $order->total_cents,
            'currency'     => 'VND',
            'status'       => Payment::STATUS_INITIATED,
        ]);

        // Fake QR
        $qrData = url("/checkout/otp?payment_id={$payment->id}");
        $qrUrl  = "https://api.qrserver.com/v1/create-qr-code/?data=" . urlencode($qrData) . "&size=200x200";

        return response()->json([
            'success'    => true,
            'status'     => 'initiated',
            'payment_id' => $payment->id,
            'order_id'   => $order->id,
            'provider'   => $request->provider,
            'amount'     => $order->total_cents,
            'currency'   => 'VND',
            'qr_url'     => $qrUrl,
            'otp_demo'   => '123456', // demo OTP
            'message'    => 'Quét QR và nhập OTP để hoàn tất thanh toán',
        ]);
    }

    /**
     * Confirm OTP – xác nhận thanh toán, lưu snapshot order và CẤP QUYỀN SẢN PHẨM.
     * Sau khi success, FE gọi lại /v1/catalog/products/{id} sẽ thấy access.can_view = true.
     */
    public function confirmOtp(Request $request, $id)
    {
        $data =$request->validate([
            'otp' => 'required|string'
        ]);

        $user = $request->user();
        $payment = Payment::with(['order.items.product'])->findOrFail($id);

        // Bảo vệ: payment phải thuộc chính user hiện tại
        if (!$user || (int) $payment->user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized payment'], 403);
        }

        if ($payment->status !== Payment::STATUS_INITIATED) {
            return response()->json([
                'success' => false,
                'message' => 'Giao dịch đã xử lý'
            ], 400);
        }

        $otp = $data['otp'];

        // ❌ Sai OTP
        if ($otp !== '123456') {
            return response()->json([
                'success' => false,
                'status'  => 'failed',
                'message' => 'OTP invalid ',
            ]);
            return;
        }

        // ✅ Đúng OTP → success
        $order = $payment->order; // đã eager load

        // Snapshot order (giữ lại lịch sử)
        $snapshot = null;
        if ($order) {
            $snapshot = [
                'order_id'    => $order->id,
                'total_cents' => $order->total_cents,
                'status'      => $order->status ?? 'paid',
                'items'       => $order->items->map(function ($item) {
                    return [
                        'product_id'       => $item->product_id,
                        'title'            => optional($item->product)->title,
                        'quantity'         => $item->quantity,
                        'unit_price_cents' => $item->unit_price_cents,
                    ];
                })->toArray(),
            ];
        }

        DB::transaction(function () use ($payment, $order, $user, $snapshot) {
            // 1) Cập nhật payment
            $payment->update([
                'status'         => Payment::STATUS_SUCCESS,
                'order_snapshot' => $snapshot,
            ]);

            // 2) Cập nhật trạng thái order (nếu có trường status)
            if ($order) {
                if (property_exists($order, 'status') || $order->getAttribute('status') !== null) {
                    $order->status = 'paid';
                    $order->save();
                }

                // 3) CẤP QUYỀN: gắn toàn bộ product trong order cho user
                // Ưu tiên qua quan hệ many-to-many nếu đã định nghĩa: $user->products()
                $productIds = $order->items->pluck('product_id')->filter()->unique()->all();

                if (method_exists($user, 'products')) {
                    // Không ghi đè, chỉ gắn thêm (idempotent)
                    $user->products()->syncWithoutDetaching($productIds);
                } else {
                    // Fallback: ghi trực tiếp vào pivot payments (chuẩn Laravel)
                    // Cần có bảng payments với cột user_id, product_id (unique composite)
                    $rows = [];
                    $now  = now();
                    foreach ($productIds as $pid) {
                        $rows[] = [
                            'user_id'    => $user->id,
                            'created_at' => $now,
                            'provider'=> $payment->provider,
                            'updated_at' => $now,
                            'amount_cents'=>$order->total_cents,

                        ];
                    }
                    if (!empty($rows)) {
                        DB::table('payments')->insertOrIgnore($rows);
                    }
                }

                // 4) Giữ lại order đã thanh toán để Library có thể hiển thị purchases
                // Trước đây code xoá order sau khi thanh toán dẫn tới /v1/library không thấy sản phẩm đã mua
                // nên chúng ta KHÔNG xoá order nữa. Order giữ status='paid'.
            }
        });

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Thanh toán thành công bằng OTP. Quyền đọc đã được mở.',
        ]);
    }

    /**
     * Lịch sử thanh toán của user.
     */
    public function history(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $payments = Payment::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id'             => $payment->id,
                    'order_id'       => $payment->order_id,
                    'provider'       => $payment->provider,
                    'amount_cents'   => $payment->amount_cents,
                    'currency'       => $payment->currency,
                    'status'         => $payment->status,
                    'created_at'     => $payment->created_at,
                    'order_snapshot' => $payment->order_snapshot,
                ];
            });

        return response()->json([
            'success' => true,
            'history' => $payments
        ]);
    }

    /**
     * Admin: lịch sử có filter nâng cao (paginate).
     */
    public function adminHistory(Request $request)
    {
        $query = Payment::with(['user'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('provider')) {
            $query->where('provider', $request->provider);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('created_at', [$request->from, $request->to]);
        }
        if ($request->filled('query')) {
            $q = $request->query('query');
            $query->whereHas('user', function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $payments = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data'    => $payments,
        ]);
    }

    /**
     * Admin: danh sách payment (paginate RAW trả trực tiếp).
     */
    public function adminIndex(Request $request)
    {
        $query = Payment::with('user')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('provider')) {
            $query->where('provider', $request->string('provider'));
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }
        if ($request->filled('query')) {
            $q = $request->query('query');
            $query->whereHas('user', function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }
        if ($request->filled('from') || $request->filled('to')) {
            $from = $request->input('from');
            $to   = $request->input('to');
            if ($from && $to) {
                $query->whereBetween('created_at', [$from, $to]);
            } elseif ($from) {
                $query->where('created_at', '>=', $from);
            } elseif ($to) {
                $query->where('created_at', '<=', $to);
            }
        }

        $perPage  = (int) $request->get('per_page', 20);
        $payments = $query->paginate($perPage)->withQueryString();

        return response()->json($payments);
    }

    public function adminDelete($id)
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully',
        ]);
    }
}
