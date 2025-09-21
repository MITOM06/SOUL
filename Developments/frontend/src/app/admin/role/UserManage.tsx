"use client";

import { useEffect, useState } from "react";
import { adminUsersAPI } from "@/lib/api";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
}

interface UserManageProps {
  roleFilter: "user" | "admin"; // 👈 bắt buộc truyền vào
}

export default function UserManage({ roleFilter }: UserManageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<User & { password: string }>>({});
  const [meta, setMeta] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  // load khi mount hoặc page thay đổi
  useEffect(() => {
    fetchUsers(currentPage, roleFilter);
  }, [currentPage, roleFilter]);

  // 👉 fetch và sort latest
  const fetchUsers = async (page = 1, role: "user" | "admin") => {
    setLoading(true);
    try {
      const res = await adminUsersAPI.getAll({ page, role, per_page: 15 });

      // sort latest (mới nhất trước)
      const sortedUsers = (res.data.data ?? []).sort(
        (a: User, b: User) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setUsers(sortedUsers);
      setMeta(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  // Tạo user
  const createUser = async () => {
    try {
      await adminUsersAPI.create({
        email: form.email,
        name: form.name,
        role: roleFilter,
        password: form.password,
        is_active: form.is_active ?? true,
      });
      setShowForm(false);
      setForm({});
      fetchUsers(currentPage, roleFilter);
    } catch (err) {
      console.error("Create User Error:", err);
    }
  };

  // Update
  const updateUser = async () => {
    if (!selectedUser) return;
    try {
      await adminUsersAPI.update(selectedUser.id, {
        email: form.email ?? selectedUser.email,
        name: form.name ?? selectedUser.name,
        role: roleFilter,
        password: form.password || undefined,
        is_active: form.is_active ?? selectedUser.is_active,
      });
      setShowForm(false);
      setForm({});
      setSelectedUser(null);
      fetchUsers(currentPage, roleFilter);
    } catch (err) {
      console.error("Update User Error:", err);
    }
  };

  // Delete
  const deleteUser = async (userId: number) => {
    if (!confirm("Bạn có chắc muốn xoá user này?")) return;
    try {
      await adminUsersAPI.delete(userId);
      fetchUsers(currentPage, roleFilter);
    } catch (err) {
      console.error("Delete User Error:", err);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tiêu đề + thanh tìm kiếm + nút thêm */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">
          {roleFilter === "admin" ? "Admins Management" : "Users Management"}
        </h1>
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
          <button
            onClick={() => { setSelectedUser(null); setForm({ is_active: true }); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:brightness-110"
          >
            Add {roleFilter === 'admin' ? 'Admin' : 'User'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {users
              .filter((u) => {
                if (!query.trim()) return true;
                const q = query.toLowerCase();
                return (
                  (u.name ?? "").toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q)
                );
              })
              .map((user, index) => (
              <tr
                key={user.id}
                className={`text-center transition cursor-pointer ${selectedRowId===user.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedRowId(prev => prev===user.id ? null : user.id)}
              >
                <td className="border p-2">{(meta?.from ?? 0) + index}</td>
                <td className="border p-2">{user.name || "(No name)"}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.is_active ? "✅" : "❌"}</td>
                <td className="border p-2">
                  {new Date(user.created_at).toLocaleString()}
                </td>
                <td className="border p-2 space-x-2">
                  {selectedRowId===user.id ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setForm(user); setShowForm(true); }}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:brightness-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:brightness-105"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-500">Click row to select</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && (
          <div className="flex justify-between items-center p-3 bg-gray-50 border-t">
            <button
              disabled={!meta.prev_page_url}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {meta.current_page} / {meta.last_page}
            </span>
            <button
              disabled={!meta.next_page_url}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Profile-style Edit/Add Panel */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 animate-fade-in">
          <div className="bg-white rounded-2xl w-[min(720px,92vw)] shadow-xl overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="px-6 py-5 border-b bg-gray-50 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-600 text-white grid place-items-center text-lg font-bold">
                {(form.name ?? selectedUser?.name ?? selectedUser?.email ?? 'U').toString().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {selectedUser ? 'Edit Profile' : 'Add Profile'}
                </h2>
                <p className="text-sm text-gray-500">Role: {roleFilter === 'admin' ? 'Admin' : 'User'}</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded"
                aria-label="Close"
              >✕</button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Full name</label>
                  <input
                    className="mt-1 w-full border px-3 py-2 rounded"
                    placeholder="Name"
                    value={form.name ?? ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    className="mt-1 w-full border px-3 py-2 rounded"
                    placeholder="Email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Password</label>
                  <input
                    className="mt-1 w-full border px-3 py-2 rounded"
                    placeholder="Set new password"
                    type="password"
                    value={form.password ?? ""}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="active"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={form.is_active ?? true}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <label htmlFor="active" className="text-sm">Active account</label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={selectedUser ? updateUser : createUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:brightness-110"
              >
                {selectedUser ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
