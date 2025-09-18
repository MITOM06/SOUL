'use client';

import { useEffect, useState } from 'react'

type ProductType = 'ebook' | 'podcast';

interface ProductInput {
  type: ProductType;
  title: string;
  description?: string;
  price_cents: number;
  thumbnail_url?: string;
  category?: string;
  slug?: string;
  files?: { file_type: string; file_url: string; is_preview?: boolean }[];
}

interface ProductListItem {
  id: number;
  type: ProductType;
  title: string;
  description?: string | null;
  price_cents: number;
  thumbnail_url?: string | null;
  category?: string | null;
  slug?: string | null;
  is_active?: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export default function AdminProductsV2() {
  const [items, setItems] = useState<ProductListItem[]>([])
  const [form, setForm] = useState<ProductInput>({ type:'ebook', title:'', price_cents:0, files:[] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // --- NEW: edit mode ---
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const r = await fetch(`${API}/v1/catalog/products?per_page=100`)
    const j = await r.json()
    setItems(j?.data?.items || [])
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const resetForm = () => {
    setForm({ type:'ebook', title:'', price_cents:0, files:[] })
    setMode('create')
    setEditingId(null)
  }

  const create = async () => {
    setSaving(true)
    const r = await fetch(`${API}/v1/catalog/products`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(form)
    })
    const j = await r.json()
    setSaving(false)
    if (j.success) { resetForm(); await load() }
    else alert(j.message || 'Lỗi tạo sản phẩm')
  }

  // --- NEW: load 1 sản phẩm để sửa ---
  const startEdit = async (id: number) => {
    // lấy detail để điền form (đảm bảo có description,…)
    const r = await fetch(`${API}/v1/catalog/products/${id}`)
    const j = await r.json()
    if (!j?.success) { alert('Không tải được sản phẩm'); return }
    const p = j.data.product as ProductListItem
    setForm({
      type: (p.type as ProductType) || 'ebook',
      title: p.title || '',
      description: p.description || '',
      price_cents: p.price_cents || 0,
      thumbnail_url: p.thumbnail_url || '',
      category: p.category || '',
      slug: p.slug || '',
      // files không sửa trong update; nếu cần có thể thêm UI riêng
    })
    setMode('edit')
    setEditingId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // --- NEW: gọi PUT update ---
  const update = async () => {
    if (!editingId) return
    setSaving(true)
    const body: Partial<ProductInput> = {
      type: form.type,
      title: form.title,
      description: form.description,
      price_cents: form.price_cents,
      thumbnail_url: form.thumbnail_url,
      category: form.category,
      slug: form.slug,
      // không gửi files trong update (API hiện không xử lý files.* ở PUT)
    }
    const r = await fetch(`${API}/v1/catalog/products/${editingId}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    const j = await r.json()
    setSaving(false)
    if (j.success) { resetForm(); await load() }
    else alert(j.message || 'Lỗi cập nhật sản phẩm')
  }

  const del = async (id:number) => {
    if (!confirm('Xoá sản phẩm này?')) return
    const r = await fetch(`${API}/v1/catalog/products/${id}`, { method:'DELETE' })
    const j = await r.json()
    if (j.success) {
      if (editingId === id) resetForm()
      await load()
    } else {
      alert(j.message || 'Không xoá được')
    }
  }

  const formatVND = (n: number | null | undefined, withSymbol = true) => {
  const v = Number(n ?? 0);
  const s = v.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  return withSymbol ? `${s} đ` : s; // đổi true/false theo ý bạn
};


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin · Product Management (v2)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold mb-3">
              {mode === 'create' ? 'Tạo sản phẩm' : `Sửa sản phẩm #${editingId}`}
            </h2>
            {mode === 'edit' && (
              <button
                onClick={resetForm}
                className="px-2 py-1 rounded bg-gray-200"
                title="Hủy chỉnh sửa"
              >
                Hủy
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Loại
              <select value={form.type} onChange={e=>setForm({...form, type: e.target.value as ProductType})} className="w-full border rounded px-2 py-1">
                <option value="ebook">Ebook</option>
                <option value="podcast">Podcast</option>
              </select>
            </label>
            <label className="block text-sm">Tiêu đề
              <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="w-full border rounded px-2 py-1"/>
            </label>
            <label className="block text-sm">Mô tả
              <textarea value={form.description||''} onChange={e=>setForm({...form, description:e.target.value})} className="w-full border rounded px-2 py-1"/>
            </label>
            <label className="block text-sm">Giá (đồng)
              <input type="number" value={form.price_cents} onChange={e=>setForm({...form, price_cents:Number(e.target.value)})} className="w-full border rounded px-2 py-1"/>
            </label>
            <label className="block text-sm">Ảnh bìa URL
              <input value={form.thumbnail_url||''} onChange={e=>setForm({...form, thumbnail_url:e.target.value})} className="w-full border rounded px-2 py-1"/>
            </label>
            <label className="block text-sm">Thể loại
              <input value={form.category||''} onChange={e=>setForm({...form, category:e.target.value})} className="w-full border rounded px-2 py-1"/>
            </label>

            {/* Tạo mới có khu vực Files; update tạm thời không chỉnh sửa files */}
            {mode === 'create' && (
              <div className="border rounded p-2">
                <div className="font-medium mb-2">Files</div>
                {(form.files||[]).map((f,idx)=>(
                  <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                    <input placeholder="file_type (pdf/mp3)" value={f.file_type} onChange={e=>{
                      const files=[...(form.files||[])]; files[idx]={...files[idx], file_type:e.target.value}; setForm({...form, files})
                    }} className="border rounded px-2 py-1"/>
                    <input placeholder="file_url" value={f.file_url} onChange={e=>{
                      const files=[...(form.files||[])]; files[idx]={...files[idx], file_url:e.target.value}; setForm({...form, files})
                    }} className="border rounded px-2 py-1"/>
                    <label className="text-sm flex items-center gap-2">
                      <input type="checkbox" checked={!!f.is_preview} onChange={e=>{
                        const files=[...(form.files||[])]; files[idx]={...files[idx], is_preview:e.target.checked}; setForm({...form, files})
                      }}/>
                      Preview
                    </label>
                  </div>
                ))}
                <button className="px-2 py-1 rounded bg-gray-200"
                        onClick={()=>setForm({...form, files:[...(form.files||[]), {file_type:'pdf', file_url:'', is_preview:true }]})}>
                  + Thêm file
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {mode === 'create' ? (
                <button onClick={create} disabled={saving}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
                  {saving ? 'Đang tạo…' : 'Tạo'}
                </button>
              ) : (
                <button onClick={update} disabled={saving || !editingId}
                        className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60">
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </button>
              )}
              {mode === 'edit' && (
                <button onClick={resetForm} className="px-4 py-2 rounded bg-gray-200">Hủy</button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: List */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Danh sách</h2>
          {loading ? <div>Đang tải…</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(p => (
                <div key={p.id} className="border rounded p-3">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-500">{p.type} · {p.category || '—'}</div>
                  <div className="text-sm">
                    {p.price_cents ? formatVND(p.price_cents, true) : 'Miễn phí'}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a href={`/book/${p.id}`} className="px-2 py-1 rounded bg-gray-100">Xem</a>
                    {/* NEW: nút Sửa */}
                    <button onClick={()=>startEdit(p.id)} className="px-2 py-1 rounded bg-yellow-500 text-white">Sửa</button>
                    <button onClick={()=>del(p.id)} className="px-2 py-1 rounded bg-red-600 text-white">Xoá</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
