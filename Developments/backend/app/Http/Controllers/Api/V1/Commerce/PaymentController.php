<?php

namespace App\Http\Controllers\Api\V1\Commerce;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Payment;
use App\Models\UserSubscription;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

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
            if ($payment->order) {
                $payment->order->update(['status' => 'paid']);
            }
            if ($payment->subscription) {
                // activate linked subscription
                $now = Carbon::now();
                $payment->subscription->update([
                    'status' => 'active',
                    'start_date' => $now,
                    'end_date' => (clone $now)->addMonth(),
                ]);
            }
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

    // Mirror webhook success side-effects
    if ($payment->order) {
        $payment->order->update(['status' => 'paid']);
    }
    if ($payment->subscription) {
        $now = Carbon::now();
        $payment->subscription->update([
            'status' => 'active',
            'start_date' => $now,
            'end_date' => (clone $now)->addMonth(),
        ]);
    }

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

    /**
     * Checkout for subscriptions: create a Payment + pending subscription with QR info.
     */
    public function checkoutSubscription(Request $request)
    {
        $user = $request->user() ?? Auth::user();

        $request->validate([
            'plan_key' => ['required', Rule::in(['basic','premium','vip'])],
            'provider' => ['nullable','string'],
        ]);

        $planKey = $request->input('plan_key');
        $provider = $request->input('provider', 'fake');

        $pricing = [
            'basic'   => 0,
            'premium' => 19900,
            'vip'     => 29900,
        ];
        $amount = $pricing[$planKey] ?? 0;

        // Create a payment record (no order)
        $payment = Payment::create([
            'order_id' => null,
            'user_id' => $user?->id,
            'provider' => $provider,
            'amount_cents' => $amount,
            'currency' => 'VND',
            'status' => Payment::STATUS_INITIATED,
        ]);

        // Create (or upsert) a pending subscription linked to this payment
        $now = Carbon::now();
        $sub = UserSubscription::create([
            'user_id'     => $user->id,
            'plan_key'    => $planKey,
            'status'      => $amount > 0 ? 'pending' : 'active',
            'start_date'  => $now,
            'end_date'    => (clone $now)->addMonth(),
            'price_cents' => $amount,
            'payment_id'  => $payment->id,
        ]);

        // Generate simple QR code
        $qrData = "Thanh toán gói {$planKey} cho user #{$user->id} (payment #{$payment->id})";
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?data=" . urlencode($qrData) . "&size=200x200";

        return response()->json([
            'success' => true,
            'payment_id' => $payment->id,
            'plan_key' => $planKey,
            'amount' => $amount,
            'currency' => 'VND',
            'provider' => $provider,
            'qr_url' => $qrUrl,
            'subscription_id' => $sub->id,
            'status' => $sub->status,
        ]);
    }



}
