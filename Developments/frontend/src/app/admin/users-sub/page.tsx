"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminUserSubscriptionsAPI } from "@/lib/api";

type Sub = {
  id: number;
  user_id: number;
  plan: "basic" | "premium" | "vip";
  status: "active" | "canceled" | "expired";
  start_date?: string | null;
  end_date?: string | null;
  price_cents?: number | null;
  payment_id?: number | null;
  user?: { id: number; email: string; name?: string | null };
};

export default function AdminUserSubsPage() {
  const [items, setItems] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [planFilter, setPlanFilter] = useState<"all"|"basic"|"premium"|"vip">('all');
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"canceled"|"expired"|"pending">('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [meta, setMeta] = useState<any>(null);

  // form nhỏ để thêm/sửa
  const emptyForm: Partial<Sub> = {
    user_id: undefined as any,
    plan: "basic",
    status: "active",
    start_date: "",
    end_date: "",
    price_cents: 0,
    payment_id: undefined,
  };
  const [form, setForm] = useState<Partial<Sub>>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchAll = async (pageArg = page) => {
    setLoading(true);
    try {
      const params: any = { page: pageArg, per_page: perPage };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (planFilter !== 'all') params.plan = planFilter;
      if (query.trim()) params.search = query.trim();
      const res = await adminUserSubscriptionsAPI.getAll(params);
      const payload = res?.data ?? {};
      const paginator = payload?.data && Array.isArray(payload.data?.data) ? payload.data : null;
      setItems(paginator?.data ?? []);
      setMeta(paginator);
    } catch (err) {
      console.error(err);
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters change (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchAll(1);
  }, [query, statusFilter, planFilter]);

  // Fetch when page changes (only if not triggered by filter change)
  useEffect(() => {
    if (page !== 1) {
      fetchAll(page);
    }
  }, [page]);

  const onCreate = async () => {
    try {
      if (!form.user_id) return toast.error("user_id is required");
      const payload = {
        user_id: Number(form.user_id),
        plan_key: (form.plan ?? "basic") as Sub["plan"],
        status: (form.status ?? "active") as Sub["status"],
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        price_cents: form.price_cents ?? 0,
        payment_id: form.payment_id ?? null,
      };
      await adminUserSubscriptionsAPI.create(payload);
      toast.success("Created");
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };

  const onUpdate = async () => {
    try {
      if (!editingId) return;
      const payload: any = {
        plan: form.plan,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        price_cents: form.price_cents ?? 0,
        payment_id: form.payment_id ?? null,
      };
      await adminUserSubscriptionsAPI.update(editingId, payload);
      toast.success("Updated");
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this subscription?")) return;
    try {
      await adminUserSubscriptionsAPI.delete(id);
      toast.success("Deleted");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const startEdit = (sub: Sub) => {
    setEditingId(sub.id);
    setForm({
      user_id: sub.user_id,
      plan: sub.plan,
      status: sub.status,
      start_date: sub.start_date?.slice(0, 10) ?? "",
      end_date: sub.end_date?.slice(0, 10) ?? "",
      price_cents: sub.price_cents ?? 0,
      payment_id: sub.payment_id ?? undefined,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Users Subscriptions</h1>
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <input
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
              placeholder="Search by user name or email..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e)=>{ setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={planFilter}
            onChange={(e)=>{ setPlanFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All plans</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
          <button
            onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:brightness-110"
          >
            Add Subscription
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Plan</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">End</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-4 text-center text-sm text-zinc-500">No data</td></tr>
            )}
            {items.map((s, idx) => (
              <tr
                key={s.id}
                className={`text-left transition cursor-pointer ${selectedId===s.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedId(prev => prev === s.id ? null : s.id)}
              >
                  <td className="px-4 py-2 border">{((meta?.from ?? 0) as number) + idx}</td>
                  <td className="px-4 py-2 border">{s.user?.name || s.user?.email || s.user_id}</td>
                  <td className="px-4 py-2 border">{s.plan}</td>
                  <td className="px-4 py-2 border">{s.status}</td>
                  <td className="px-4 py-2 border">{s.start_date?.slice(0,10) ?? '-'}</td>
                  <td className="px-4 py-2 border">{s.end_date?.slice(0,10) ?? '-'}</td>
                  <td className="px-4 py-2 border">{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(((s.price_cents ?? 0))/100)}</td>
                  <td className="px-4 py-2 border">
                    {selectedId === s.id ? (
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={(e) => { e.stopPropagation(); startEdit(s); }}>Edit</button>
                        <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}>Delete</button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Click row to select</span>
                    )}
                  </td>
                </tr>
              ))}
            {loading && (
              <tr><td colSpan={8} className="px-4 py-4 text-center text-sm text-zinc-500">Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center p-3">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={!meta?.prev_page_url}
          onClick={() => { const next = Math.max(1, page - 1); setPage(next); fetchAll(next); }}
        >Prev</button>
        <span className="text-sm text-zinc-600">Page {meta?.current_page ?? page} / {meta?.last_page ?? '?'}</span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          disabled={!meta?.next_page_url}
          onClick={() => { const next = page + 1; setPage(next); fetchAll(next); }}
        >Next</button>
      </div>

      {/* Profile-style modal for create/edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 animate-fade-in">
          <div className="bg-white rounded-2xl w-[min(720px,92vw)] shadow-xl overflow-hidden animate-zoom-in">
            <div className="px-6 py-5 border-b bg-gray-50 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center text-lg font-bold">S</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">{editingId ? 'Edit Subscription' : 'Add Subscription'}</h2>
                <p className="text-sm text-gray-500">Manage user plan and billing metadata</p>
              </div>
              <button onClick={cancelEdit} className="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded" aria-label="Close">✕</button>
            </div>

            <div className="px-6 py-5 grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">User ID</label>
                  <input
                    type="number"
                    value={form.user_id ?? ''}
                    onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })}
                    className="mt-1 w-full border px-3 py-2 rounded"
                    placeholder="user_id"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value as any })}
                    className="mt-1 w-full border px-3 py-2 rounded"
                  >
                    <option value="basic">basic</option>
                    <option value="premium">premium</option>
                    <option value="vip">vip</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full border px-3 py-2 rounded"
                  >
                    <option value="active">active</option>
                    <option value="canceled">canceled</option>
                    <option value="expired">expired</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Price (cents)</label>
                  <input
                    type="number"
                    value={form.price_cents ?? 0}
                    onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })}
                    className="mt-1 w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Start date</label>
                  <input
                    type="date"
                    value={form.start_date ?? ''}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="mt-1 w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">End date</label>
                  <input
                    type="date"
                    value={form.end_date ?? ''}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="mt-1 w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Payment ID</label>
                <input
                  type="number"
                  value={form.payment_id ?? ''}
                  onChange={(e) => setForm({ ...form, payment_id: Number(e.target.value) })}
                  className="mt-1 w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={editingId ? onUpdate : onCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:brightness-110">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
