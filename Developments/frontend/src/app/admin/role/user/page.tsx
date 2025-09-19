"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { adminRoleUsersAPI } from '@/lib/api';

type AppUser = {
  id: number;
  name?: string | null;
  email: string;
  role: 'user';
  is_active: boolean;
};

export default function UsersManagementPage() {

	const [items, setItems] = useState<AppUser[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState<number>(0);
	const [page, setPage] = useState<number>(1);
	const [lastPage, setLastPage] = useState<number>(1);

	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const editingItem = useMemo(() => items.find(i => i.id === editingId) || null, [items, editingId]);

	const [form, setForm] = useState<{ name?: string; email: string; password?: string; is_active: boolean }>({ email: '', is_active: true });

  const openCreate = () => {
	setEditingId(null);
	setForm({ email: '', name: '', password: '', is_active: true });
	setIsFormOpen(true);
  };

  const openEdit = (item: AppUser) => {
	setEditingId(item.id);
	setForm({ email: item.email, name: item.name ?? '', password: '', is_active: !!item.is_active });
	setIsFormOpen(true);
  };

  const closeForm = () => {
	setIsFormOpen(false);
	setEditingId(null);
  };

	const load = async (pageNum = 1) => {
		setLoading(true);
		setError(null);
		try {
			const resp = await adminRoleUsersAPI.listUsers({ per_page: 100, page: pageNum });
			const paged = resp.data?.data;
			const data = paged?.data ?? [];
			setTotal(paged?.total || 0);
			setLastPage(paged?.last_page || 1);
			setPage(paged?.current_page || 1);
			const mapped: AppUser[] = data.map((u: any) => ({
				id: u.id,
				name: u.name,
				email: u.email,
				role: 'user',
				is_active: !!u.is_active,
			}));
			setItems(mapped);
		} catch (e: any) {
			setError(e?.response?.data?.message || 'Failed to load users');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);
	const handlePrev = () => {
		if (page > 1) setPage(page - 1);
	};
	const handleNext = () => {
		if (page < lastPage) setPage(page + 1);
	};

  const onSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	try {
	  if (editingId) {
		await adminRoleUsersAPI.updateUser(editingId, {
		  name: form.name,
		  email: form.email,
		  is_active: form.is_active,
		  ...(form.password ? { password: form.password } : {}),
		});
	  } else {
		await adminRoleUsersAPI.createUser({
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
	if (!confirm('Delete this user?')) return;
	try {
	  await adminRoleUsersAPI.deleteUser(id);
	  await load();
	} catch (e: any) {
	  alert(e?.response?.data?.message || 'Delete failed');
	}
  };

	return (
		<section className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Users</h1>
				<button onClick={openCreate} className="px-3 py-2 bg-blue-600 text-white rounded-md">Add User</button>
			</div>

			<div className="flex items-center gap-4">
				<span className="text-sm text-zinc-600">Total: {total}</span>
				<button onClick={handlePrev} disabled={page <= 1} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
				<span className="text-sm">Page {page} / {lastPage}</span>
				<button onClick={handleNext} disabled={page >= lastPage} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
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
							<h2 className="text-lg font-semibold">{editingId ? 'Edit User' : 'Add User'}</h2>
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
