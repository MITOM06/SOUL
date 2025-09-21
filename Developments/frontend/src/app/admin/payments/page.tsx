"use client";

import { useEffect, useState } from "react";
import { adminPaymentsAPI } from "@/lib/api";

interface Payment {
  id: number;
  user: { id: number; name: string; email: string } | null;
  provider: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);

  // filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminPaymentsAPI.getAll({
        page,
        status,
        provider,
        query,
      });
      setPayments(res.data?.data ?? []); // mảng data
      setMeta(res.data ?? null); // meta để phân trang
    } catch (err) {
      console.error("Fetch payments error:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [status, provider]); // query filter client-side

  if (loading) return <p className="p-6">Loading...</p>;

  // filter client-side theo query
  const filtered = Array.isArray(payments)
    ? payments.filter((p) => {
        const q = query.trim().toLowerCase();
        if (q) {
          const name = (p.user?.name || "").toLowerCase();
          const email = (p.user?.email || "").toLowerCase();
          return name.includes(q) || email.includes(q);
        }
        return true;
      })
    : [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Payments Management</h1>

        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
          {/* Search */}
          <div className="relative md:w-80">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by user name or email..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="initiated">Initiated</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Provider filter */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Providers</option>
            <option value="momo">Momo</option>
            <option value="bank">Bank</option>
            <option value="paypal">Paypal</option>
            <option value="stripe">Stripe</option>
            <option value="credit_card">Credit Card</option>
          </select>

          <button
            onClick={() => fetchPayments(1)}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Provider</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filtered.map((p, index) => (
              <tr key={p.id} className="text-center hover:bg-gray-50">
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{p.user?.name}</td>
                <td className="border p-2">{p.user?.email}</td>
                <td className="border p-2">{p.provider}</td>
                <td className="border p-2">
                  {(p.amount_cents / 100).toLocaleString()} {p.currency}
                </td>
                <td className="border p-2 capitalize">{p.status}</td>
                <td className="border p-2">
                  {new Date(p.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex justify-between items-center p-3 bg-gray-50 border-t">
          <button
            disabled={meta.current_page <= 1}
            onClick={() => fetchPayments(meta.current_page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {meta.current_page} / {meta.last_page}
          </span>
          <button
            disabled={meta.current_page >= meta.last_page}
            onClick={() => fetchPayments(meta.current_page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
