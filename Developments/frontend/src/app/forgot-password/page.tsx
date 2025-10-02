"use client";

import React, { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPrettyPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null); setLoading(true);
    try {
      const r = await api.post('/v1/auth/forgot-password', { email: email.trim() });
      if (r.status >= 200 && r.status < 300 && (r.data?.success ?? true)) {
        const dbg = r.data?.debug_password as string | undefined;
        setMsg('Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.' + (dbg ? ` (Debug: ${dbg})` : ''));
      } else {
        setErr(r.data?.message || 'Gửi mật khẩu thất bại. Vui lòng thử lại.');
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Không thể gửi email. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[80vh] grid place-items-center overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      <section className="w-full max-w-md px-4 sm:px-6">
        <div className="rounded-2xl border bg-white/90 shadow-sm backdrop-blur">
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white font-bold">🔒</div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Quên mật khẩu</h1>
                <p className="text-sm text-zinc-600">Nhập email tài khoản để nhận mật khẩu mới (8 ký tự ngẫu nhiên).</p>
              </div>
            </div>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Email tài khoản</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">✉️</span>
                <input
                  type="email"
                  required
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm outline-none ring-blue-500/20 focus:ring-4"
                />
              </div>
            </label>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Đang gửi…' : 'Gửi mật khẩu mới'}
            </button>

            {msg && <div className="text-sm text-emerald-600">{msg}</div>}
            {err && <div className="text-sm text-red-600">{err}</div>}

            <div className="pt-2 text-sm text-zinc-600">
              <span>Bạn đã nhớ mật khẩu?</span>{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Vì lý do bảo mật, bạn nên đổi lại mật khẩu trong trang hồ sơ sau khi đăng nhập thành công.
        </p>
      </section>
    </main>
  );
}
