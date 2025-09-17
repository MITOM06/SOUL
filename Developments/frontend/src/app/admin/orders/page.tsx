"use client";

import { useEffect, useState } from "react";
import { adminOrdersAPI, adminOrderItemsAPI } from "@/lib/api";

interface Product {
  id: number;
  title: string;
  price_cents: number;
  thumbnail_url?: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  unit_price_cents: number;
  product: Product;
}

interface Order {
  id: number;
  user: User;
  total_cents: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function AdminOrderManage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminOrdersAPI.getAll();
      setOrders(res.data?.data ?? []);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Xoá toàn bộ Order
  const deleteOrder = async (orderId: number) => {
    if (!confirm("Bạn có chắc muốn xoá Order này?")) return;
    try {
      await adminOrdersAPI.delete(orderId);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error("Delete Order Error:", err);
    }
  };

  // Xoá 1 sản phẩm trong Order
  const deleteOrderItem = async (itemId: number) => {
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này khỏi Order?")) return;
    try {
      await adminOrderItemsAPI.delete(itemId);
      fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          items: selectedOrder.items.filter((i) => i.id !== itemId),
        });
      }
    } catch (err) {
      console.error("Delete OrderItem Error:", err);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  // tính toán pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 p-4 space-y-4">
        <button className="w-full py-2 bg-white border rounded">
          OVERVIEW
        </button>
        <button className="w-full py-2 bg-white border rounded">
          USER MANAGEMENT
        </button>
        <button className="w-full py-2 bg-white border rounded">
          BOOKS MANAGEMENT
        </button>
        <button className="w-full py-2 bg-white border rounded">
          PODCASTS MANAGEMENT
        </button>
        <button className="w-full py-2 bg-blue-500 text-white rounded">
          ORDERS MANAGEMENT
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Orders Management</h1>
        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, index) => (
              <tr key={order.id} className="text-center">
                <td className="border p-2">
                  {orders.length - (startIndex + index)}
                </td>
                <td
                  className="border p-2 text-blue-600 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  {order.user?.name}
                </td>
                <td className="border p-2">{order.user?.email}</td>
                <td className="border p-2">
                  {(order.total_cents / 100).toLocaleString()} ₫
                </td>
                <td className="border p-2">{order.status}</td>
                <td className="border p-2">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="border p-2 space-x-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Modal xem chi tiết */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-2/3 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                Order #{selectedOrder.id} - {selectedOrder.user?.name}
              </h2>
              <p>Email: {selectedOrder.user?.email}</p>
              <p>Status: {selectedOrder.status}</p>
              <p>Total: {selectedOrder.total_cents} cents</p>
              <p>
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Products</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.thumbnail_url || "/placeholder.png"}
                        alt={item.product?.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-semibold">{item.product?.title}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × {item.unit_price_cents} cents
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteOrderItem(item.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6 space-x-2">
                <button
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete Order
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
