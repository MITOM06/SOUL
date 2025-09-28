// Change password page. Robust multi-endpoint client.
'use client';

import React, { useMemo, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import api from '@/lib/api';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

type Method = 'POST' | 'PUT' | 'PATCH';
type Attempt = {
  url: string;
  method: Method;
  headers?: Record<string, string>;
  body: Record<string, any> | URLSearchParams;
};

function strengthLabel(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { label: 'Weak', color: 'text-rose-600' };
  if (s === 3) return { label: 'Fair', color: 'text-amber-600' };
  if (s === 4) return { label: 'Good', color: 'text-emerald-600' };
  return { label: 'Strong', color: 'text-emerald-700' };
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const newStrength = useMemo(() => strengthLabel(newPassword), [newPassword]);

  const validate = () => {
    if (!currentPassword) return 'Please enter your current password.';
    if (!newPassword) return 'Please enter a new password.';
    if (newPassword.length < 8) return 'New password must be at least 8 characters.';
    if (newPassword === currentPassword) return 'New password must be different from current password.';
    if (confirmPassword !== newPassword) return 'Confirm password does not match.';
    return null;
  };

  // Tạo toàn bộ "chiến lược" gọi API
  const buildAttempts = (): Attempt[] => {
    const attempts: Attempt[] = [];

    const urls = [
      '/v1/auth/password',
      '/v1/auth/change-password',
      '/v1/users/password',
      '/v1/profile/password',
      '/v1/me/password',
      // endpoint hành động chung (backend tự phân nhánh theo "action")
      '/v1/profile',
      '/v1/me',
      '/v1/user',
      '/v1/account',
    ];
    const methods: Method[] = ['POST', 'PUT', 'PATCH'];

    // Các hình dạng payload phổ biến (JSON)
    const jsonShapes = [
      // Laravel Fortify / nhiều API
      { current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword },
      // old/new naming
      { old_password: currentPassword, new_password: newPassword, new_password_confirmation: confirmPassword },
      // generic
      { old_password: currentPassword, password: newPassword, password_confirmation: confirmPassword },
      { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword },
      // action-style
      { action: 'change_password', current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword },
    ];

    // Biến thể form-encoded (một số server chấp nhận form-data/x-www-form-urlencoded)
    const formShapes = [
      new URLSearchParams({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
      new URLSearchParams({
        old_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      }),
      new URLSearchParams({
        action: 'change_password',
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    ];

    // 1) JSON + Content-Type
    for (const url of urls) {
      for (const method of methods) {
        for (const body of jsonShapes) {
          attempts.push({
            url,
            method,
            headers: { 'Content-Type': 'application/json' },
            body,
          });
          // Thử thêm X-HTTP-Method-Override (nếu server chỉ cho POST)
          attempts.push({
            url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-HTTP-Method-Override': method },
            body,
          });
        }
      }
    }

    // 2) x-www-form-urlencoded
    for (const url of urls) {
      for (const method of methods) {
        for (const body of formShapes) {
          attempts.push({
            url,
            method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          });
          attempts.push({
            url,
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-HTTP-Method-Override': method },
            body,
          });
        }
      }
    }

    return attempts;
  };

  const tryAxiosThenFetch = async (a: Attempt) => {
    // axios instance trước
    try {
      const r = await api.request({
        url: a.url,
        method: a.method,
        headers: a.headers,
        data: a.body,
      });
      if (r?.status && r.status >= 200 && r.status < 300) return { ok: true };
    } catch (e: any) {
      const code = e?.response?.status;
      if ([200, 204].includes(code)) return { ok: true };
      if ([400, 401, 403, 422].includes(code)) {
        const m = e?.response?.data?.message || 'Invalid password or payload.';
        return { ok: false, message: m };
      }
      // 404/405: cứ thử cách khác
    }

    // fetch fallback
    try {
      const r = await fetch(`${API_BASE}${a.url}`, {
        method: a.method,
        credentials: 'include',
        headers: a.headers,
        body:
          a.headers?.['Content-Type'] === 'application/json'
            ? JSON.stringify(a.body)
            : (a.body as URLSearchParams),
      });
      if (r.ok) return { ok: true };
      if ([400, 401, 403, 422].includes(r.status)) {
        let msg = 'Invalid password.';
        try {
          const j = await r.json();
          msg = j?.message || msg;
        } catch {}
        return { ok: false, message: msg };
      }
    } catch {
      // ignore, thử attempt sau
    }
    return { ok: false };
  };

  const callApi = async () => {
    const attempts = buildAttempts();
    for (const a of attempts) {
      const res = await tryAxiosThenFetch(a);
      if (res.ok) return { ok: true };
      if (res.message) return { ok: false, message: res.message };
    }
    return { ok: false, message: 'No password endpoint accepted the request (405/404). Please enable one of the supported endpoints on the server.' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }

    setBusy(true);
    const res = await callApi();
    setBusy(false);

    if (res.ok) {
      setOkMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrMsg(res.message || 'Failed to update password.');
    }
  };

  return (
    <UserPanelLayout>
      <div className="space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">Change Password</h1>

        {okMsg && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 text-sm">
            {okMsg}
          </div>
        )}
        {errMsg && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
            {errMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <div className="mt-1 relative">
              <input
                type={showCur ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCur((v) => !v)}
                className="absolute inset-y-0 right-2 text-sm text-gray-500"
                aria-label="Toggle visibility"
              >
                {showCur ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="mt-1 relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-2 text-sm text-gray-500"
                aria-label="Toggle visibility"
              >
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
            {!!newPassword && (
              <div className={`mt-1 text-xs ${newStrength.color}`}>
                Strength: {newStrength.label}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div className="mt-1 relative">
              <input
                type={showCon ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-10"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCon((v) => !v)}
                className="absolute inset-y-0 right-2 text-sm text-gray-500"
                aria-label="Toggle visibility"
              >
                {showCon ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? 'Updating…' : 'Update Password'}
          </button>

          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters and should include upper/lowercase, numbers, and symbols for best security.
          </p>
        </form>
      </div>
    </UserPanelLayout>
  );
}
