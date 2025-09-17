'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ordersAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// --- Interfaces ---
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
  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // --- Auth redirect ---
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role === "admin") {
        router.push("/admin/orders"); // admin thì về trang admin
      }
    }
  }, [authLoading, user, router]);

  // --- Fetch order khi có user hợp lệ ---
  useEffect(() => {
    if (user && user.role !== "admin") {
      fetchOrder();
    }
  }, [user]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll();
      setOrder(res.data?.data ?? null);
    } catch (err: any) {
      console.error("Fetch Order Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Update quantity ---
  const updateQuantity = async (itemId: number, newQty: number) => {
    if (!order) return;
    setActionLoading(true);

    try {
      if (newQty < 1) {
        await deleteItem(itemId);
        return;
      }
      await ordersAPI.updateItemQuantity(itemId, newQty);
      fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  // --- Delete item ---
  const deleteItem = async (itemId: number) => {
    if (!order) return;
    setActionLoading(true);

    try {
      await ordersAPI.deleteItem(itemId);
      fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  // --- Loading / Empty state ---
  if (authLoading || loading) return <p className="p-6">Loading...</p>;
  if (!order || !order.items || order.items.length === 0)
    return <p className="p-6">No pending order found.</p>;

  const total = order.items.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Cart</h1>
      <p className="mb-4 text-gray-600">Status: {order.status}</p>
      {actionLoading && <p className="mb-4 text-blue-600">Updating...</p>}

      <div className="space-y-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center border rounded-lg p-4"
          >
            {/* Left: Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
                <span className="text-xs text-gray-500">Image</span>
              </div>
              <div>
                <h2 className="font-semibold">{item.product?.title}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={actionLoading}
                    className="px-2 py-1 border rounded"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={actionLoading}
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Price + Delete */}
            <div className="text-right">
              <p className="font-medium">{item.unit_price_cents} cents</p>
              <button
                onClick={() => deleteItem(item.id)}
                disabled={actionLoading}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 flex justify-between items-center border-t pt-4">
        <p className="text-lg font-semibold">Total Price: {total} cents</p>
        <button className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Buy Product
        </button>
      </div>
    </div>
  );
}