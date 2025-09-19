"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ordersAPI } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { paymentsAPI } from "@/lib/api";

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

  // 👉 Lấy dữ liệu checkout qua axios (có token)
  useEffect(() => {
	if (!orderId) return;
	(async () => {
	  try {
		const res = await paymentsAPI.initCheckout(Number(orderId));
		setPaymentData(res.data);
	  } catch (err) {
		console.error("Init checkout error:", err);
	  }
	})();
  }, [orderId]);
  
  const handleCheckout = async () => {
	try {
	  const res = await ordersAPI.checkout(Number(orderId));
	  if (res.data.success) {
		setPaid(true);
		refresh();
	  }
	} catch (err) {
	  console.error("Checkout API error:", err);
	}
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
        <img src={paymentData.qr_url} alt="QR Code" className="mx-auto border rounded-lg" />
        <button
          onClick={() => router.push("/orders")}
          className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại Đơn hàng
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
      <img src={paymentData.qr_url} alt="QR Code" className="mx-auto border rounded-lg" />
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
