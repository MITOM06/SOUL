"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminUserSubscriptionsAPI } from "@/lib/api";

type Sub = {
  id: number;
  user_id: number;
  plan: "basic" | "standard" | "premium";
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

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await adminUserSubscriptionsAPI.getAll();
      setItems(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onCreate = async () => {
    try {
      if (!form.user_id) return toast.error("user_id is required");
      const payload = {
        user_id: Number(form.user_id),
        plan: (form.plan ?? "basic") as Sub["plan"],
        status: (form.status ?? "active") as Sub["status"],
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        price_cents: form.price_cents ?? 0,
        payment_id: form.payment_id ?? null,
      };
      await adminUserSubscriptionsAPI.create(payload);
      toast.success("Created");
      setForm(emptyForm);
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Users Subscriptions</h1>

      {/* Form create / edit */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="number"
            value={form.user_id ?? ""}
            onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })}
            className="input"
            placeholder="user_id"
          />
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value as any })}
            className="input"
          >
            <option value="basic">basic</option>
            <option value="standard">standard</option>
            <option value="premium">premium</option>
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="input"
          >
            <option value="active">active</option>
            <option value="canceled">canceled</option>
            <option value="expired">expired</option>
          </select>
          <input
            type="date"
            value={form.start_date ?? ""}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="input"
            placeholder="start_date"
          />
          <input
            type="date"
            value={form.end_date ?? ""}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="input"
            placeholder="end_date"
          />
          <input
            type="number"
            value={form.price_cents ?? 0}
            onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })}
            className="input"
            placeholder="price_cents"
          />
        </div>
        <div className="flex gap-2">
          {editingId ? (
            <>
              <button className="btn" onClick={onUpdate}>Save</button>
              <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <button className="btn" onClick={onCreate}>Create</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Plan</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">End</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Price</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-4 text-center text-sm text-zinc-500">No data</td></tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.id}</td>
                <td className="px-4 py-2">
                  {s.user?.email ?? s.user_id}
                </td>
                <td className="px-4 py-2">{s.plan}</td>
                <td className="px-4 py-2">{s.status}</td>
                <td className="px-4 py-2">{s.start_date?.slice(0,10) ?? '-'}</td>
                <td className="px-4 py-2">{s.end_date?.slice(0,10) ?? '-'}</td>
                <td className="px-4 py-2">{((s.price_cents ?? 0)/100).toFixed(2)}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="btn-secondary" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn-danger" onClick={() => onDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={8} className="px-4 py-4 text-center text-sm text-zinc-500">Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
