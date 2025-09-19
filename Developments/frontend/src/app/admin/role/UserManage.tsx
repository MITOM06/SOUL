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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<User & { password: string }>>({});
  const [meta, setMeta] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // load khi mount hoặc page thay đổi
  useEffect(() => {
    fetchUsers(currentPage, roleFilter);
  }, [currentPage, roleFilter]);

  // 👉 fetch và sort latest
  const fetchUsers = async (page = 1, role: "user" | "admin") => {
    setLoading(true);
    try {
      const res = await adminUsersAPI.getAll({ page, role });

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
      {/* Tiêu đề */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {roleFilter === "admin" ? "Admins Management" : "Users Management"}
        </h1>
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
            {users.map((user, index) => (
              <tr key={user.id} className="text-center hover:bg-gray-50 transition">
                <td className="border p-2">{(meta?.from ?? 0) + index}</td>
                <td className="border p-2">{user.name || "(No name)"}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.is_active ? "✅" : "❌"}</td>
                <td className="border p-2">
                  {new Date(user.created_at).toLocaleString()}
                </td>
                <td className="border p-2 space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setForm(user);
                      setShowForm(true);
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:brightness-105"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:brightness-105"
                  >
                    Delete
                  </button>
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

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg w-96 space-y-4 shadow-lg">
            <h2 className="text-xl font-bold">
              {selectedUser ? "Edit User" : "Add User"}
            </h2>
            <input
              className="w-full border px-3 py-2 rounded"
              placeholder="Name"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full border px-3 py-2 rounded"
              placeholder="Email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="w-full border px-3 py-2 rounded"
              placeholder="Password"
              type="password"
              value={form.password ?? ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={selectedUser ? updateUser : createUser}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
