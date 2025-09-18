"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ordersAPI } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
interface PaymentData {
  order_id: number;
  amount: number;
  qr_url: string;
  provider: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paid, setPaid] = useState(false);
const { refresh } = useCart();
  // Lấy dữ liệu thanh toán ban đầu
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/payment/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ order_id: orderId, provider: "fake" }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setPaymentData(data);
      } catch (err) {
        console.error("Checkout error:", err);
      }
    })();
  }, [orderId]);

  // 👉 xử lý thanh toán (Bearer token auto kèm từ interceptor)
  const handleCheckout = async () => {
  try {
    const res = await ordersAPI.checkout(Number(orderId)); // gọi OrderController@checkout
    if (res.data.success) {
      setPaid(true);
    } else {
      alert(res.data.message || "Thanh toán thất bại");
    }
  } catch (err) {
    console.error("Checkout API error:", err);
    alert("Lỗi khi thanh toán");
  }
   refresh();
};

  if (!orderId) return <p>Không có order nào.</p>;
  if (!paymentData) return <p>Đang khởi tạo thanh toán...</p>;

  if (paid) {
  return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        Thanh toán thành công 🎉
      </h1>
      <p className="mb-2">Đơn hàng #{orderId} đã được thanh toán</p>

      {/* vẫn giữ QR */}
      {paymentData && (
        <>
          <img
            src={paymentData.qr_url}
            alt="QR Code"
            className="mx-auto border rounded-lg"
          />
          <p className="mt-2 text-gray-600">QR đã sử dụng để thanh toán</p>
        </>
      )}

      <button
        onClick={() => router.push("/orders")}
        className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Quay lại Giỏ hàng
      </button>
    </div>
  );
}

  return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">
        Checkout Order #{paymentData.order_id}
      </h1>
      <p className="mb-2">
        Tổng tiền: {(paymentData.amount / 100).toLocaleString()} VND
      </p>
      <img
        src={paymentData.qr_url}
        alt="QR Code"
        className="mx-auto border rounded-lg"
      />
      <p className="mt-2 text-gray-600">Quét mã QR để thanh toán</p>

      <button
        onClick={handleCheckout}
        className="mt-6 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Tôi đã thanh toán
      </button>
    </div>
  );
}
