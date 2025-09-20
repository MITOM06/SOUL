"use client";

import { useState } from "react";
import UserPanelLayout from "@/components/UserPanelLayout";

type Note = { id: number; from: string; subject: string; body: string; date: string };

const demo: Note[] = [
  { id: 1, from: 'Admin', subject: 'Welcome to SOUL', body: 'Thanks for joining. Enjoy reading and listening!', date: new Date().toLocaleString() },
  { id: 2, from: 'Admin', subject: 'New books this week', body: 'We added 10 new educational titles.', date: new Date().toLocaleString() },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<Note[]>(demo);
  const [active, setActive] = useState<Note | null>(items[0] || null);
  const [reply, setReply] = useState('');

  const sendReply = () => {
    // demo only
    setReply('');
  };

  return (
    <UserPanelLayout>
      <div className="grid md:grid-cols-[300px_minmax(0,1fr)] min-h-[60vh] rounded-2xl border overflow-hidden">
        {/* list */}
        <div className="border-r bg-white">
          <div className="p-3 font-semibold">Inbox</div>
          <div className="divide-y">
            {items.map(n => (
              <button key={n.id} className={`w-full text-left p-3 hover:bg-gray-50 ${active?.id===n.id?'bg-gray-50':''}`} onClick={()=>setActive(n)}>
                <div className="text-sm font-medium">{n.subject}</div>
                <div className="text-xs text-zinc-600">{n.from} · {n.date}</div>
              </button>
            ))}
          </div>
        </div>
        {/* detail */}
        <div className="bg-white p-4 grid content-start gap-3">
          {active ? (
            <>
              <div className="text-lg font-semibold">{active.subject}</div>
              <div className="text-sm text-zinc-600">From {active.from} · {active.date}</div>
              <div className="mt-2 text-sm">{active.body}</div>
              <div className="mt-4 border-t pt-3">
                <label className="text-sm text-zinc-600">Reply</label>
                <textarea value={reply} onChange={e=>setReply(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 h-28" placeholder="Write your reply..." />
                <div className="mt-2 flex justify-end">
                  <button onClick={sendReply} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-zinc-600">Select a notification</div>
          )}
        </div>
      </div>
    </UserPanelLayout>
  );
}
