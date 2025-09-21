<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Payment;

class PaymentController extends Controller
{
    /**
     * Checkout – tạo payment (không OTP trong DB, chỉ giả lập).
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'provider' => 'required|string',
        ]);

        $order = Order::findOrFail($request->order_id);

        $payment = Payment::create([
            'order_id'     => $order->id,
            'user_id'      => $request->user()->id ?? null,
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
     * Confirm OTP – xác nhận thanh toán, lưu snapshot order.
     */
    public function confirmOtp(Request $request, $id)
    {
        $request->validate([
            'otp' => 'required|string'
        ]);

        $payment = Payment::findOrFail($id);

        if ($payment->status !== Payment::STATUS_INITIATED) {
            return response()->json([
                'success' => false,
                'message' => 'Giao dịch đã xử lý'
            ], 400);
        }

        $otp = $request->input('otp');

        // ❌ Sai OTP
        if ($otp !== '123456') {
            return response()->json([
                'success' => false,
                'status'  => 'failed',
                'message' => 'OTP không đúng',
            ]);
        }

        // ✅ Đúng OTP → success
        // ✅ Đúng OTP → success
        $order = $payment->order;

        $snapshot = null;
        if ($order) {
            $snapshot = [
                'order_id'    => $order->id,
                'total_cents' => $order->total_cents,
                'status'      => $order->status,
                'items'       => $order->items->map(function ($item) {
                    return [
                        'product_id'       => $item->product_id,
                        'title'            => $item->product->title,
                        'quantity'         => $item->quantity,
                        'unit_price_cents' => $item->unit_price_cents,
                    ];
                })->toArray(),
            ];
        }

        $payment->update([
            'status'         => Payment::STATUS_SUCCESS,
            'order_snapshot' => $snapshot,
        ]);

        // 👉 Xoá order gốc (tuỳ chọn)
        if ($order) {
            $order->delete();
        }

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Thanh toán thành công bằng OTP',
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
                    'id'            => $payment->id,
                    'order_id'      => $payment->order_id,
                    'provider'      => $payment->provider,
                    'amount_cents'  => $payment->amount_cents,
                    'currency'      => $payment->currency,
                    'status'        => $payment->status,
                    'created_at'    => $payment->created_at,
                    'order_snapshot' => $payment->order_snapshot, // 👈 đảm bảo xuất ra
                ];
            });

        return response()->json([
            'success' => true,
            'history' => $payments
        ]);
    }

   public function adminHistory(Request $request)
{
    $query = Payment::with(['user'])
        ->orderBy('created_at', 'desc');

    // lọc theo status
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }

    // lọc theo provider
    if ($request->filled('provider')) {
        $query->where('provider', $request->provider);
    }

    // lọc theo user_id
    if ($request->filled('user_id')) {
        $query->where('user_id', $request->user_id);
    }

    // lọc theo date range
    if ($request->filled('from') && $request->filled('to')) {
        $query->whereBetween('created_at', [$request->from, $request->to]);
    }

    // 🔥 Thêm lọc theo query (tên/email user)
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
     * Admin: Danh sách tất cả payment.
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
    // tìm theo tên/email user
    if ($request->filled('query')) {
        $q = $request->query('query');
        $query->whereHas('user', function ($sub) use ($q) {
            $sub->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%");
        });
    }
    // from/to (optional)
    if ($request->filled('from') || $request->filled('to')) {
        $from = $request->input('from'); // 'YYYY-MM-DD' hoặc datetime
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

    // trả paginate RAW: { current_page, data: [...], last_page, ... }
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
