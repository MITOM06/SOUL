"use client";

import React from 'react';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';

// Admin product management page. Allows admins to view books and
// podcasts in separate sections. Basic actions such as edit and
// delete are displayed as buttons but do not perform any
// operations in this demo.

export default function AdminProductManagementPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Products Management</h1>
      {/* Books section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Books</h2>
          <button className="btn">Add Book</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demoBooks.map((b, idx) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{b.title}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{b.author}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{b.category}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{b.access_level}</td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Podcasts section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Podcasts</h2>
          <button className="btn">Add Podcast</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demoPodcasts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{p.title}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{p.host}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{p.category}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{p.access_level}</td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}