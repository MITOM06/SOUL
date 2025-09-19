<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Payment;

class PaymentController extends Controller
{
    /**
     * Bước 1: User checkout
     */
  public function checkout(Request $request)
{
    $request->validate([
        'order_id' => 'required|exists:orders,id',
        'provider' => 'required|string',
    ]);

    $order = Order::findOrFail($request->order_id);

    $payment = Payment::create([
        'order_id' => $order->id,
        'user_id' => $request->user()->id ?? null,
        'provider' => $request->provider,
        'amount_cents' => $order->total_cents,
        'currency' => 'VND',
        'status' => Payment::STATUS_INITIATED, // 🔥 chưa thành công
    ]);

    // Fake QR
    $qrData = "Thanh toán cho đơn #{$order->id}";
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?data=" . urlencode($qrData) . "&size=200x200";

    return response()->json([
        'success' => true,
        'payment_id' => $payment->id,
        'order_id' => $order->id,
        'provider' => $request->provider,
        'amount' => $order->total_cents,
        'currency' => 'VND',
        'qr_url' => $qrUrl,
    ]);
}
    /**
     * Bước 2: Gateway gọi webhook báo kết quả
     */
    public function webhook(Request $request)
    {
        $payment = Payment::where('provider_payment_id', $request->input('transaction_id'))->first();

        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        $status = $request->input('status'); // success | failed | refunded

        $payment->update([
            'status' => $status,
            'raw_response' => $request->all(),
        ]);

        // Nếu thành công → update order thành "paid"
        if ($status === Payment::STATUS_SUCCESS) {
            $payment->order->update(['status' => 'paid']);
        }

        return response()->json(['success' => true]);
    }

    public function confirm(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        $status = $request->input('status'); // 'success' hoặc 'failed'

        if ($status === 'success') {
            $payment->status = Payment::STATUS_SUCCESS;  
            $payment->save();

            return response()->json([
                'success' => true,
                'message' => 'Thanh toán thành công'
            ]);
        } else {
            $payment->status = Payment::STATUS_FAILED;   
            $payment->save();

            return response()->json([
                'success' => false,
                'message' => 'Thanh toán thất bại'
            ]);
        }
    }

    public function autoSuccess($id)
{
    $payment = Payment::findOrFail($id);
    $payment->status = Payment::STATUS_SUCCESS;
    $payment->save();

    return response()->json([
        'success' => true,
        'message' => 'Thanh toán thành công (tự động)',
    ]);
}

public function listTransactions(Request $request)
{
    $user = $request->user();
    $transactions = Payment::where('user_id', $user->id)
        ->orderByDesc('created_at')
        ->get();

    return response()->json(['success' => true, 'data' => $transactions]);
}

public function showTransaction($id, Request $request)
{
    $user = $request->user();
    $transaction = Payment::where('user_id', $user->id)->findOrFail($id);

    return response()->json(['success' => true, 'data' => $transaction]);
}



}