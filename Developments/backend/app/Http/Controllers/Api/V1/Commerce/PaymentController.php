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
            'status'       => Payment::STATUS_INITIATED, // chưa thành công
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
            'otp_demo'   => '123456', // 👈 chỉ để hiển thị cho dev/test
            'message'    => 'Quét QR và nhập OTP để hoàn tất thanh toán',
        ]);
    }

    /**
     * Confirm OTP – chỉ so sánh với "123456".
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

        // Check OTP
        if ($otp !== '123456') {
            return response()->json([
                'success' => false,
                'status'  => 'failed',
                'message' => $otp === '' 
                    ? 'Vui lòng nhập OTP' 
                    : 'OTP không đúng',
            ]);
        }

        // Đúng OTP → success
        $payment->update(['status' => Payment::STATUS_SUCCESS]);
        $payment->order?->update(['status' => 'paid']);

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => 'Thanh toán thành công bằng OTP',
        ]);
    }
}
