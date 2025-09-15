'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Product {
  id: number;
  title: string;
  price_cents: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  unit_price_cents: number;
  product: Product;
}

interface Order {
  id: number;
  status: string;
  total_cents: number;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchOrder();
  }, []);

  // Kiểm tra login và lấy order
  const checkAuthAndFetchOrder = async () => {
    try {
      // Gọi API user để check login
      await axios.get("http://localhost:8000/api/v1/user", { withCredentials: true });
      // Nếu login, lấy order
      fetchOrder();
    } catch (err) {
      console.error("Auth Error:", err);
      router.push("/auth/login"); // chưa login → redirect
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/orders", { withCredentials: true });
      setOrder(res.data.data);
    } catch (err) {
      console.error("Fetch Order Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (!order) return;

    try {
      if (newQty < 1) {
        await deleteItem(itemId);
        return;
      }

      await axios.put(
        `http://localhost:8000/api/v1/orders/items/${itemId}`,
        { quantity: newQty },
        { withCredentials: true } // gửi cookie
      );

      fetchOrder();
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/v1/orders/items/${itemId}`, { withCredentials: true });
      fetchOrder();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!order || order.items.length === 0) return <p>No pending order found.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Cart / Pending Order</h1>
      <p>Status: {order.status}</p>
      <div>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1rem",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <div>
              <strong>{item.product.title}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span style={{ margin: "0 0.5rem" }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
            </div>
            <div>
              <span>{item.unit_price_cents} cents</span>
              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  marginLeft: "1rem",
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
      <p><strong>Total: {order.total_cents} cents</strong></p>
    </div>
  );
}
