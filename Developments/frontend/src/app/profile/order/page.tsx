"use client";

import { useEffect, useState } from "react";
import { ordersAPI } from "@/lib/api";

export default function OrderPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    ordersAPI.getAll().then((res) => {
      setOrders(res.data.data || []); // nếu API trả null thì fallback []
    });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Order History</h1>

      <input
        type="text"
        placeholder="Search by order ID"
        className="border w-full p-2 mb-4 rounded"
      />

      <div className="space-y-4">
        {orders.length === 0 && <p>No orders found.</p>}

        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded shadow-sm">
            <p><b>Order ID:</b> {order.id}</p>
            <p><b>Status:</b> {order.status}</p>
            <p><b>Total:</b> {order.total_cents / 100} VND</p>
            <p><b>Created at:</b> {new Date(order.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
