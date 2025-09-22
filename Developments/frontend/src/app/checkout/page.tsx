"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ordersAPI, paymentsAPI } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

interface PaymentData {
  order_id: number;
  payment_id: number;
  amount: number;
  qr_url: string;
  provider: string;
  status: string;
  otp_code?: string;
}

interface OrderDetail {
  id: number;
  status: string;
  total_cents: number;
  items: {
    id: number;
    quantity: number;
    unit_price_cents: number;
    product: { id: number; title: string };
  }[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paymentId = searchParams.get("payment_id");

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [provider, setProvider] = useState("bank");
  const [paid, setPaid] = useState(false);
  const [otp, setOtp] = useState("");

  const { refresh } = useCart();

  // Load dữ liệu thanh toán
  useEffect(() => {
    (async () => {
      try {
        if (paymentId) {
          const p = await paymentsAPI.getById(Number(paymentId));
          const payment = p.data?.data || p.data;
          setPaymentData(payment);
          setOrderDetail(payment?.order || null);
          if (payment?.status === "success") {
            setPaid(true);
          }
        } else if (orderId) {
          const [p, o] = await Promise.all([
            paymentsAPI.initCheckout(Number(orderId), provider),
            ordersAPI.getById(Number(orderId)),
          ]);
          const payment = p.data;
          setPaymentData(payment);
          setOrderDetail(o.data?.data || o.data?.order || null);
          if (payment?.status === "success") {
            setPaid(true);
          }
        }
      } catch (err) {
        console.error("Init checkout error:", err);
      }
    })();
  }, [orderId, paymentId, provider]);

  // Xác thực OTP
  const handleConfirmOtp = async () => {
    try {
      if (!otp) {
        alert("Vui lòng nhập OTP");
        return;
      }

      if (!paymentData) return;

      const res = await paymentsAPI.confirmOtp(paymentData.payment_id, otp);

      console.log("Confirm OTP response:", res.data);

      if (res.data?.success && res.data?.status === "success") {
        setPaid(true);
        refresh();
      } else {
        alert(res.data?.message || "OTP không đúng");
      }
    } catch (err: any) {
      console.error("Confirm OTP error:", err.response?.data || err);
      alert(err?.response?.data?.message || "Lỗi xác thực OTP");
    }
  };

  if (!orderId && !paymentId) return <p>No order or payment found.</p>;
  if (!paymentData) return <p>Initializing payment...</p>;

  if (paid) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment successful 🎉
        </h1>
        <p className="mb-2">Order #{paymentData.order_id} has been paid.</p>
        <button
          onClick={() => router.push("/orders")}
          className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* QR + OTP */}
        <div className="text-center border rounded-xl p-4 bg-white">
          {!paymentId && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-left mb-1">
                Payment method
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="bank">Bank</option>
                <option value="momo">Momo</option>
                <option value="apple-pay">Apple Pay</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
          )}

          <img
            src={paymentData.qr_url}
            alt="QR Code"
            className="mx-auto border rounded-lg"
          />
          <p className="mt-2 text-gray-600">Scan the QR to pay</p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the OTP"
              className="border rounded px-3 py-2 w-full"
            />
            <button
              onClick={handleConfirmOtp}
              className="mt-2 w-full px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Confirm OTP
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border rounded-xl p-4 bg-white">
          <div className="font-semibold mb-2">
            Order #{paymentData.order_id}
          </div>
          <div className="divide-y text-sm">
            {orderDetail?.items?.map((it) => (
              <div key={it.id} className="py-2 flex justify-between gap-3">
                <div>
                  <div className="font-medium">{it.product?.title}</div>
                  <div className="text-gray-500">
                    Qty: {it.quantity} ×{" "}
                    {(it.unit_price_cents / 100).toLocaleString()} ₫
                  </div>
                </div>
                <div className="font-semibold">
                  {((it.unit_price_cents * it.quantity) / 100).toLocaleString()}{" "}
                  ₫
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between">
            <div>Payment method</div>
            <div className="font-medium">{paymentData.provider}</div>
          </div>
          <div className="mt-1 flex justify-between">
            <div>Total</div>
            <div className="text-lg font-bold">
              {(paymentData.amount / 100).toLocaleString()} ₫
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
