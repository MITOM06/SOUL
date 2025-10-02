"use client";

import React, { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setErr(null); setLoading(true);
    try {
      const r = await api.post('/v1/auth/forgot-password', { email: email.trim() });
      if (r.status >= 200 && r.status < 300 && (r.data?.success ?? true)) {
        const dbg = r.data?.debug_password as string | undefined;
        setMsg('A new password has been sent to your email.' + (dbg ? ` Debug password: ${dbg}` : ''));
      } else {
        setErr(r.data?.message || 'Failed to send password.');
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to send password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[60vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="mt-1 text-sm text-zinc-600">Enter your account email. We will send a new 8‑character password to your inbox and set it as your current password.</p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-zinc-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-4 ring-blue-500/20"
            />
          </label>
          <button disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 disabled:opacity-60">
            {loading ? 'Sending…' : 'Send new password'}
          </button>
        </form>

        {msg && <div className="mt-3 text-sm text-emerald-600">{msg}</div>}
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

        <div className="mt-4 text-sm">
          <Link href="/auth/login" className="text-blue-600 hover:underline">Back to sign in</Link>
        </div>
      </div>
    </section>
  );
}
