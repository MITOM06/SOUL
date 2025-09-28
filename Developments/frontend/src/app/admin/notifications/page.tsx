"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";

type Tab = 'broadcast' | 'individual';

type Product = {
  id: number;
  type: 'ebook' | 'podcast';
  title: string;
  description?: string | null;
  price_cents: number;
  thumbnail_url?: string | null;
  category?: string | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');
const toAbs = (u?: string|null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<Tab>('broadcast');
  const [status, setStatus] = useState<string | null>(null);

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="inline-flex rounded-lg border overflow-hidden">
          <button className={`px-3 py-2 ${tab==='broadcast' ? 'bg-gray-100 font-semibold' : ''}`} onClick={()=>setTab('broadcast')}>Broadcast</button>
          <button className={`px-3 py-2 ${tab==='individual' ? 'bg-gray-100 font-semibold' : ''}`} onClick={()=>setTab('individual')}>Individual</button>
        </div>
      </div>

      {tab === 'broadcast' ? <BroadcastForm onSent={setStatus} /> : <IndividualForm onSent={setStatus} />}

      {status && <div className="text-green-600 text-sm">{status}</div>}
    </section>
  );
}

function BroadcastForm({ onSent }: { onSent: (s: string) => void }) {
  const [contentType, setContentType] = useState<'ebook'|'podcast'>('ebook');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all'|'users'|'admins'>('users');

  // filters
  const [availableCats, setAvailableCats] = useState<string[]>([]);
  const [catQuery, setCatQuery] = useState('');
  const [cats, setCats] = useState<string[]>([]); // selected categories (multi)
  const [minUSD, setMinUSD] = useState('');
  const [maxUSD, setMaxUSD] = useState('');

  // results
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [selected, setSelected] = useState<Product | null>(null);

  const targetRef = useRef<HTMLDivElement>(null);

  // load categories when contentType changes
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setAvailableCats([]);
        setCats([]);
        // for ebook: derive from products list
        if (contentType === 'ebook') {
          const res = await fetch(`${API_BASE}/v1/catalog/products?type=ebook&per_page=400`, { signal: ac.signal });
          const j = await res.json();
          const arr: Product[] = j?.data?.items || [];
          const set = new Set<string>();
          arr.forEach(p => { if (p.category) set.add(String(p.category)); });
          setAvailableCats(Array.from(set.values()).sort((a,b)=>a.localeCompare(b)));
        } else {
          // podcast categories endpoint
          const res = await fetch(`${API_BASE}/v1/catalog/podcast/categories`, { signal: ac.signal });
          const j = await res.json();
          const arr = (j?.data || []) as Array<{ category: string }>; 
          setAvailableCats(arr.map(c => c.category));
        }
      } catch (e: any) {
        // ignore
      }
    })();
    return () => ac.abort();
  }, [contentType]);

  // load products whenever filters change
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setError(null);
        const params = new URLSearchParams({ type: contentType, per_page: '200' });
        const min = Number(minUSD), max = Number(maxUSD);
        if (!Number.isNaN(min) && min > 0) params.set('min_price', String(min * 100));
        if (!Number.isNaN(max) && max > 0) params.set('max_price', String(max * 100));
        // if exactly one category selected, let backend filter; otherwise we'll filter locally
        if (cats.length === 1) params.set('category', cats[0]);
        const res = await fetch(`${API_BASE}/v1/catalog/products?${params.toString()}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        let list: Product[] = j?.data?.items || [];
        if (cats.length > 1) {
          const set = new Set(cats);
          list = list.filter(p => set.has(String(p.category || '')));
        }
        setItems(list);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [contentType, minUSD, maxUSD, cats]);

  const filteredCatOpts = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return availableCats.filter(c => !q || c.toLowerCase().includes(q));
  }, [availableCats, catQuery]);

  const chipSummary = useMemo(() => {
    const chips: Array<{ k: string; v: string; onClear?: () => void }>=[];
    chips.push({ k: 'Type', v: contentType });
    cats.forEach((c) => chips.push({ k: 'Category', v: c, onClear: () => setCats(prev => prev.filter(x => x !== c)) }));
    const min = Number(minUSD), max = Number(maxUSD);
    if (!Number.isNaN(min) && min > 0) chips.push({ k: 'Min $', v: String(min), onClear: () => setMinUSD('') });
    if (!Number.isNaN(max) && max > 0) chips.push({ k: 'Max $', v: String(max), onClear: () => setMaxUSD('') });
    return chips;
  }, [contentType, cats, minUSD, maxUSD]);

  const send = async () => {
    try {
      const payload: any = {
        target,
        title,
        message,
      };
      if (selected?.id) payload.product_id = selected.id;
      await api.post('/v1/admin/notifications/broadcast', payload);
      onSent('Broadcast sent to recipients.');
      setTitle(''); setMessage('');
    } catch (e: any) {
      onSent(e?.message || 'Failed to send');
    }
  };

  // fly-in animation for thumbnail
  const flyToTarget = (imgEl: HTMLImageElement) => {
    const target = targetRef.current;
    if (!target) return;
    const from = imgEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const ghost = imgEl.cloneNode(true) as HTMLImageElement;
    ghost.style.position = 'fixed';
    ghost.style.left = `${from.left}px`;
    ghost.style.top = `${from.top}px`;
    ghost.style.width = `${from.width}px`;
    ghost.style.height = `${from.height}px`;
    ghost.style.borderRadius = '12px';
    ghost.style.zIndex = '1000';
    ghost.style.transition = 'transform 600ms cubic-bezier(.2,.8,.2,1), opacity 600ms';
    document.body.appendChild(ghost);
    const dx = to.left + (to.width - from.width) / 2 - from.left;
    const dy = to.top + (to.height - from.height) / 2 - from.top;
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(${Math.max(0.2, to.width / from.width)})`;
      ghost.style.opacity = '0.2';
    });
    window.setTimeout(() => ghost.remove(), 620);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 grid gap-4">
      {/* Top compose + preview */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
        <div className="grid gap-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-zinc-600">Recipients</label>
              <select value={target} onChange={e=>setTarget(e.target.value as any)} className="w-full border rounded px-3 py-2">
                <option value="users">Users only</option>
                <option value="admins">Admins only</option>
                <option value="all">All (both)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-600">Content type</label>
              <select value={contentType} onChange={e=>setContentType(e.target.value as any)} className="w-full border rounded px-3 py-2">
                <option value="ebook">Book</option>
                <option value="podcast">Podcast</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-600">Min price ($)</label>
              <input type="number" value={minUSD} onChange={e=>setMinUSD(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="0" />
            </div>
            <div>
              <label className="text-sm text-zinc-600">Max price ($)</label>
              <input type="number" value={maxUSD} onChange={e=>setMaxUSD(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="" />
            </div>
          </div>

          {/* Category query-builder style */}
          <div className="grid gap-2">
            <label className="text-sm text-zinc-600">Categories</label>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button key={c} className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200" onClick={()=>setCats(prev=>prev.filter(x=>x!==c))} title="Remove">
                  {c} ×
                </button>
              ))}
              {cats.length === 0 && (
                <span className="text-xs text-zinc-500">No category selected</span>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <div className="md:col-span-1">
                <input value={catQuery} onChange={e=>setCatQuery(e.target.value)} placeholder="Search categories..." className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-2 max-h-24 overflow-auto p-1 border rounded">
                  {filteredCatOpts.map(c => {
                    const on = cats.includes(c);
                    return (
                      <button key={c} type="button" onClick={()=>setCats(prev => on ? prev.filter(x=>x!==c) : [...prev, c])}
                        className={`px-2 py-1 rounded-full text-xs border ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-700 hover:bg-gray-50 border-zinc-200'}`}>{c}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Filter summary bar */}
          <div className="flex flex-wrap items-center gap-2 border rounded-lg px-3 py-2 bg-zinc-50">
            {chipSummary.map((c, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border">
                <span className="text-zinc-500">{c.k}:</span> <span className="font-medium">{c.v}</span>
                {c.onClear && (
                  <button onClick={c.onClear} className="ml-1 text-zinc-500 hover:text-zinc-700">×</button>
                )}
              </span>
            ))}
            {chipSummary.length === 0 && <span className="text-xs text-zinc-500">No filters applied</span>}
            {chipSummary.length > 0 && (
              <button className="ml-auto text-xs text-blue-600 hover:underline" onClick={() => { setCats([]); setMinUSD(''); setMaxUSD(''); }}>Clear all</button>
            )}
          </div>

          {/* Results grid */}
          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">{loading ? 'Loading…' : `Results (${items.length})`}</div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map(p => (
                <button key={p.id} onClick={(e)=>{
                  const img = (e.currentTarget.querySelector('img') as HTMLImageElement | null);
                  if (img) flyToTarget(img);
                  setSelected(p);
                }} className={`relative text-left border rounded-lg overflow-hidden hover:shadow transition ${selected?.id===p.id?'ring-2 ring-blue-500':''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={toAbs(p.thumbnail_url) || ''} alt={p.title} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-2">
                    <div className="text-sm font-semibold line-clamp-2">{p.title}</div>
                    <div className="text-xs text-zinc-500">{p.category || '—'} · {p.price_cents ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(p.price_cents/100) : 'Free'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compose preview / target area */}
        <div className="border rounded-xl p-3 grid content-start gap-2 bg-zinc-50">
          <div className="text-sm text-zinc-600">Broadcast preview</div>
          <div ref={targetRef} className="relative h-36 grid place-items-center overflow-hidden rounded-xl border bg-white">
            {selected ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={toAbs(selected.thumbnail_url) || ''} alt={selected.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white drop-shadow">
                  <div className="text-xs uppercase tracking-wide">{selected.type}</div>
                  <div className="text-sm font-semibold line-clamp-2">{selected.title}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">Select a product to feature</div>
            )}
          </div>
          <div>
            <label className="text-sm text-zinc-600">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Announcement title" />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Message</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full border rounded px-3 py-2 h-24" placeholder="Announce new arrivals, promos, etc." />
          </div>
          <div className="flex justify-end">
            <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" disabled={!title.trim() || !message.trim()}>
              Send to all users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndividualForm({ onSent }: { onSent: (s: string) => void }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<'admin'|'users'>('users');
  const [role, setRole] = useState<'admin'|'user'>('user');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');

  const send = async () => {
    try {
      if (!userId) { onSent('Please enter user ID'); return; }
      await api.post('/v1/admin/notifications/individual', {
        user_id: Number(userId),
        title: subject || '(No subject)',
        message: body || '',
        product_id: productId ? Number(productId) : undefined,
      });
      onSent('Notification sent to user.');
      setSubject(''); setBody('');
    } catch (e: any) {
      onSent(e?.message || 'Failed to send');
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 grid gap-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-zinc-600">Search users</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Name or email" />
        </div>
        <div>
          <label className="text-sm text-zinc-600">Choose group</label>
          <select value={group} onChange={e=>setGroup(e.target.value as any)} className="w-full border rounded px-3 py-2">
            <option value="users">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-zinc-600">Send to role</label>
          <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full border rounded px-3 py-2">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-zinc-600">User ID</label>
          <input type="number" value={userId} onChange={e=>setUserId(e.target.value ? Number(e.target.value) : '')} className="w-full border rounded px-3 py-2" placeholder="Numeric ID" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-zinc-600">Subject</label>
          <input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-zinc-600">Message</label>
          <input value={body} onChange={e=>setBody(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-zinc-600">Attach product (optional) – ID</label>
          <input type="number" value={productId} onChange={e=>setProductId(e.target.value ? Number(e.target.value) : '')} className="w-full border rounded px-3 py-2" placeholder="Product ID" />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}
