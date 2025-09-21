<?php


namespace App\Http\Controllers\Api\V1\Commerce;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Http\Controllers\Controller;

class FakeGateway extends Controller
{
    // // Trang giả lập thanh toán
    // public function payPage(Payment $payment)
    // {
    //     return response()->json([
    //         'payment_id' => $payment->id,
    //         'order_id' => $payment->order_id,
    //         'amount' => $payment->amount_cents,
    //         'currency' => $payment->currency,
    //         'status' => $payment->status,
    //     ]);
    // }

    // // Callback (giả lập webhook)
    // public function callback(Request $request, Payment $payment)
    // {
    //     $status = $request->input('status', 'success');

    //     $payment->update([
    //         'status' => $status,
    //         'provider_payment_id' => 'FAKE-' . uniqid(),
    //         'raw_response' => $request->all(),
    //     ]);

    //     if ($status === 'success') {
    //         $payment->order->update(['status' => 'paid']);
    //     }

    //     return response()->json([
    //         'success' => true,
    //         'status' => $status,
    //     ]);
    // }
}