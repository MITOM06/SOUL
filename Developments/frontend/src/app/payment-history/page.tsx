// Payment History page.  Displays a user's payment history.
"use client";

import React, { useEffect, useState } from "react";
import UserPanelLayout from "@/components/UserPanelLayout";
import { paymentsAPI } from "@/lib/api";

interface Payment {
  id: number;
  order_id: number | null;
  provider: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  order_snapshot?: {
    order_id: number;
    total_cents: number;
    status: string;
    items: {
      product_id: number;
      title: string;
      quantity: number;
      unit_price_cents: number;
    }[];
  };
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      // 👇 truyền order_id cụ thể, ví dụ 101
      const res = await paymentsAPI.getAll(101); 
      const data = res.data?.history || [];
      setPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);

  return (
    <UserPanelLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Payment History</h1>
        {loading ? (
          <p>Loading...</p>
        ) : payments.length === 0 ? (
          <p>
            You currently have no payments. Once transactions are made, they
            will appear here.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {p.provider}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {(p.amount_cents / 100).toLocaleString()} {p.currency}
                  </td>
                  <td className="px-4 py-2 text-sm capitalize">{p.status}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </UserPanelLayout>
  );
}
