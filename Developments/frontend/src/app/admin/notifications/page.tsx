"use client";

import { useState } from "react";

type Tab = 'broadcast' | 'individual';

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
  const [type, setType] = useState<'book'|'podcast'>('book');
  const [category, setCategory] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const send = () => {
    onSent('Broadcast sent (demo).');
  };

  return (
    <div className="rounded-2xl border bg-white p-4 grid gap-3">
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-zinc-600">Content type</label>
          <select value={type} onChange={e=>setType(e.target.value as any)} className="w-full border rounded px-3 py-2">
            <option value="book">Book</option>
            <option value="podcast">Podcast</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-zinc-600">Category</label>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="all">All</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
            <option value="tech">Tech</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-zinc-600">Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="text-sm text-zinc-600">Message</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full border rounded px-3 py-2 h-32" placeholder="Announce new arrivals, promos, etc." />
      </div>
      <div className="flex justify-end">
        <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send to all users</button>
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

  const send = () => {
    onSent('Notification sent (demo).');
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
          <label className="text-sm text-zinc-600">Attach file</label>
          <input type="file" className="w-full border rounded px-3 py-2" />
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
      <div className="flex justify-end">
        <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}

