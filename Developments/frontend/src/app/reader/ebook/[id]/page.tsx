"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProductFile = {
  id: number;
  file_type: string;
  file_url: string;
  is_preview?: number | boolean;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export default function EbookPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Load product detail (public) to get files list
        const r = await fetch(`${API_BASE}/v1/catalog/products/${id}`, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        const product = j?.data?.product || {};
        const files: ProductFile[] = j?.data?.files || [];
        setTitle(product?.title || "Preview");

        // 2) Find preview PDF file
        const preview = files.find(f => (f.is_preview ? true : false) && f.file_type === 'pdf');
        if (!preview) {
          setErr('No preview PDF available for this title.');
          setLoading(false);
          return;
        }

        // 3) Download preview via backend (allows previews without auth)
        const dl = await fetch(`${API_BASE}/v1/catalog/products/${id}/files/${preview.id}/download`, { signal: ac.signal });
        if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
        const blob = await dl.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  if (!id) return <div className="p-6 text-red-600">Invalid URL</div>;
  if (loading) return <div className="p-6">Loading preview…</div>;
  if (err) return (
    <div className="p-6">
      <div className="text-red-600 mb-2">{String(err)}</div>
      <button onClick={()=>router.back()} className="px-3 py-1 rounded border">Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="font-semibold truncate pr-3">{title}</div>
        <div className="text-sm text-gray-600">Preview (first 10 pages)</div>
      </div>
      <div className="flex-1 bg-zinc-100">
        {blobUrl ? (
          <iframe src={blobUrl + '#page=1&view=FitH'} title="Preview" className="w-full h-[calc(100vh-48px)]" />
        ) : (
          <div className="p-6">No content</div>
        )}
      </div>
    </div>
  );
}

