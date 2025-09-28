"use client";

import { useEffect, useMemo, useState } from "react";
import UserPanelLayout from "@/components/UserPanelLayout";
import api, { notificationsAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/role";

type InboxItem = {
  id: number;
  to_role: 'user' | 'admin' | null;
  to_user_id?: number | null;
  from_user_id?: number | null;
  title: string;
  body?: string | null;
  payload?: any;
  created_at: string;
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = useMemo(() => items.find(i => i.id === activeId) || items[0] || null, [items, activeId]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await api.get('/v1/notifications', { signal: ac.signal as any });
        const arr: InboxItem[] = res.data?.data?.items || [];
        setItems(arr);
        if (arr.length > 0) setActiveId(arr[0].id);
        // mark all as read and notify header
        try { await notificationsAPI.markRead(); } catch {}
        try {
          const who = user?.id ? `${user.id}_${role}` : `guest_${role}`;
          localStorage.setItem(`notif_seen_${who}`, new Date().toISOString());
          window.dispatchEvent(new Event('notifications-updated'));
        } catch {}
      } catch (e: any) {
        setError(e?.message || 'Failed to load inbox');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [user, role]);

  return (
    <UserPanelLayout>
      <div className="grid md:grid-cols-[300px_minmax(0,1fr)] min-h-[60vh] rounded-2xl border overflow-hidden">
        {/* list */}
        <div className="border-r bg-white">
          <div className="p-3 font-semibold">Inbox</div>
          {loading && <div className="p-3 text-sm text-zinc-500">Loading…</div>}
          {error && <div className="p-3 text-sm text-red-600">{error}</div>}
          <div className="divide-y">
            {items.map(n => (
              <button key={n.id} className={`w-full text-left p-3 hover:bg-gray-50 ${active?.id===n.id?'bg-gray-50':''}`} onClick={()=>setActiveId(n.id)}>
                <div className="text-sm font-medium line-clamp-1">{n.title}</div>
                <div className="text-xs text-zinc-600">{new Date(n.created_at).toLocaleString()}</div>
              </button>
            ))}
            {!loading && items.length === 0 && (
              <div className="p-3 text-sm text-zinc-500">No notifications</div>
            )}
          </div>
        </div>
        {/* detail */}
        <div className="bg-white p-4 grid content-start gap-3">
          {active ? (
            <>
              <div className="text-lg font-semibold">{active.title}</div>
              <div className="text-xs text-zinc-500">{new Date(active.created_at).toLocaleString()}</div>
              {active.payload?.product && (
                <div className="mt-1 flex items-center gap-3 p-2 border rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={active.payload.product.thumbnail_url || ''} alt="" className="h-16 w-12 object-cover rounded" />
                  <div className="text-sm">
                    <div className="font-medium">{active.payload.product.title}</div>
                    <div className="text-xs text-zinc-500">{active.payload.product.type} · {active.payload.product.category || '—'}</div>
                  </div>
                </div>
              )}
              <div className="mt-2 text-sm whitespace-pre-wrap">{active.body || ''}</div>
            </>
          ) : (
            <div className="text-zinc-600">Select a notification</div>
          )}
        </div>
      </div>
    </UserPanelLayout>
  );
}
