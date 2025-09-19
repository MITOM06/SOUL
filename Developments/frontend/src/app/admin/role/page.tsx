"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { adminRoleUsersAPI } from '@/lib/api';

type AdminUser = {
  id: number;
  name?: string | null;
  email: string;
  role: 'admin';
  is_active: boolean;
};

export default function AdminsManagementPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingItem = useMemo(() => items.find(i => i.id === editingId) || null, [items, editingId]);

  const [form, setForm] = useState<{ name?: string; email: string; password?: string; is_active: boolean }>({ email: '', is_active: true });

  const openCreate = () => {
    setEditingId(null);
    setForm({ email: '', name: '', password: '', is_active: true });
    setIsFormOpen(true);
  };

  const openEdit = (item: AdminUser) => {
    setEditingId(item.id);
    setForm({ email: item.email, name: item.name ?? '', password: '', is_active: !!item.is_active });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminRoleUsersAPI.listAdmins({ per_page: 50 });
      const data = (resp.data?.data?.data ?? []) as any[]; // Laravel paginator: { data: [..], ... }
      const mapped: AdminUser[] = data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: 'admin',
        is_active: !!u.is_active,
      }));
      setItems(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminRoleUsersAPI.updateAdmin(editingId, {
          name: form.name,
          email: form.email,
          is_active: form.is_active,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await adminRoleUsersAPI.createAdmin({
          name: form.name,
          email: form.email,
          password: form.password || '',
          is_active: form.is_active,
        });
      }
      closeForm();
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this admin?')) return;
    try {
      await adminRoleUsersAPI.deleteAdmin(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
<h1 className="text-2xl font-bold">Admins</h1>
        <button onClick={openCreate} className="px-3 py-2 bg-blue-600 text-white rounded-md">Add Admin</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{u.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{u.name || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{u.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{u.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <button onClick={() => openEdit(u)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                    <button onClick={() => onDelete(u.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
          <div className="bg-white w-full max-w-lg rounded-md shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Admin' : 'Add Admin'}</h2>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Optional" />
              </div>
              <div>
<label className="block text-sm text-gray-700 mb-1">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password {editingId ? '(leave blank to keep)' : ''}</label>
                <input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex items-center gap-2">
                <input id="active" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="active" className="text-sm">Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-3 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
