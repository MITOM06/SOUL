"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';

type Tab = 'info' | 'settings' | 'password' | 'library' | 'orders' | 'transactions' | 'support';

/** Chuẩn hoá role từ nhiều dạng khác nhau về 'admin' | 'user' | 'guest' */
function normalizeRole(u: any): 'admin' | 'user' | 'guest' {
  if (!u) return 'guest';

  // 1) Trường hợp có sẵn chuỗi role
  if (typeof u.role === 'string' && u.role.trim()) {
    return u.role.toLowerCase() === 'admin' ? 'admin' : 'user';
  }

  // 2) Cờ boolean is_admin
  if (u.is_admin === true) return 'admin';

  // 3) Mảng roles (Spatie hoặc backend khác)
  if (Array.isArray(u.roles) && u.roles.length > 0) {
    const first = u.roles[0];
    if (typeof first === 'string') {
      return first.toLowerCase() === 'admin' ? 'admin' : 'user';
    }
    if (first && typeof first.name === 'string') {
      return first.name.toLowerCase() === 'admin' ? 'admin' : 'user';
    }
  }

  // 4) role_id quy ước: 1 = admin, khác = user (tuỳ hệ thống của bạn)
  if (typeof u.role_id === 'number') {
    return u.role_id === 1 ? 'admin' : 'user';
  }

  return 'user';
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const role = normalizeRole(user); // ← dùng role đã chuẩn hoá

  const renderInfo = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <p><strong>Name:</strong> {user?.name ?? 'Unnamed'}</p>
      <p><strong>Email:</strong> {user?.email ?? '—'}</p>
      <p><strong>Role:</strong> {role}</p> {/* ← hiển thị role chuẩn */}
      <button className="btn mt-4">Edit Profile</button>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Account Settings</h2>
      <p className="text-sm text-zinc-600">
        Manage your contact information and preferences. This
        section is a placeholder – integrate with a real API to
        enable editing.
      </p>
      <form className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            placeholder="Enter your address"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button type="button" className="btn">
          Save Settings
        </button>
      </form>
    </div>
  );

  const renderPassword = () => (
    <div className="space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Change Password</h2>
      <p className="text-sm text-zinc-600">
        Ensure your new password is at least six characters long.
      </p>
      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button type="button" className="btn">
          Update Password
        </button>
      </form>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Library</h2>
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Saved Books</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoBooks.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Saved Podcasts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoPodcasts.map((p) => (
            <PodcastCard key={p.id} podcast={p} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">My Orders</h2>
      <p className="text-sm text-zinc-600">
        View your current and past orders.
      </p>
      <a href="/orders" className="btn inline-block">
        Go to Orders
      </a>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Transaction History</h2>
      <p className="text-sm text-zinc-600">
        You currently have no transactions. Once payments are
        implemented, they will appear here.
      </p>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Customer Service</h2>
      <p className="text-sm text-zinc-600">
        Need help? Send us a message and we’ll get back to you.
      </p>
      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <input
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        <button type="button" className="btn">
          Send Message
        </button>
      </form>
    </div>
  );

  // Determine which section to render based on the active tab.
  let content: React.ReactNode;
  switch (activeTab) {
    case 'settings':
      content = renderSettings();
      break;
    case 'password':
      content = renderPassword();
      break;
    case 'library':
      content = renderLibrary();
      break;
    case 'orders':
      content = renderOrders();
      break;
    case 'transactions':
      content = renderTransactions();
      break;
    case 'support':
      content = renderSupport();
      break;
    case 'info':
    default:
      content = renderInfo();
  }

  // All available tabs with their labels. You can reorder or remove
  // entries here to adjust the side navigation.
  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'settings', label: 'Settings' },
    { key: 'password', label: 'Password' },
    { key: 'library', label: 'Library' },
    { key: 'orders', label: 'Orders' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'support', label: 'Support' },
  ];

   return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Side navigation */}
      {/* ... */}
      <div className="flex-1">
        {/* ... */}
      </div>
    </div>
  );
}