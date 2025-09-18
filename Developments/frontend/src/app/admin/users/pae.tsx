"use client";

import React, { useState } from 'react';
import { demoUsers, DemoUser } from '../../../data/demoUsers';

// Admin user management page. Displays a table of users with basic
// details and actions to edit, promote/demote or toggle activation.
// In this demo the actions merely update local state; they should
// call your backend when available.

export default function AdminUserManagementPage() {
  // Make a copy of the demo users so we can update state locally.
  const [users, setUsers] = useState<DemoUser[]>(demoUsers.map((u) => ({ ...u })));

  const toggleBlock = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u
      )
    );
  };

  const toggleRole = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: u.role === 'user' ? 'admin' : 'user' } : u
      )
    );
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u, idx) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{u.email}</td>
                <td className="px-4 py-2 text-sm text-gray-900 capitalize">{u.role}</td>
                <td className="px-4 py-2 text-sm text-gray-900 capitalize">{u.status}</td>
                <td className="px-4 py-2 text-sm">
                  <button
                    onClick={() => toggleRole(u.id)}
                    className="mr-2 px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    {u.role === 'user' ? 'Promote' : 'Demote'}
                  </button>
                  <button
                    onClick={() => toggleBlock(u.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    {u.status === 'active' ? 'Block' : 'Unblock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}