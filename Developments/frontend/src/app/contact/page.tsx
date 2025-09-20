"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section className="full-bleed p-6 md:p-10">
      <div className="max-w-3xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-zinc-600">We love hearing from you. Fill in the form below and we’ll get back soon.</p>
      </div>

      {/* Form centered */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={submit} className="rounded-2xl border bg-white p-6 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-600">Your name</label>
              <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm text-zinc-600">Email</label>
              <input type="email" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-600">Subject</label>
            <input value={form.subject} onChange={(e)=>setForm({ ...form, subject: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Message</label>
            <textarea value={form.message} onChange={(e)=>setForm({ ...form, message: e.target.value })} className="mt-1 w-full border rounded px-3 py-2 h-32" required />
          </div>
          <div className="flex justify-end">
            <button className="px-5 py-2 rounded-xl text-white bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)]">Send</button>
          </div>
          {sent && <div className="text-green-600 text-sm">Thanks! We received your message.</div>}
        </form>
      </div>

      {/* Map below form */}
      <div className="max-w-3xl mx-auto mt-6 rounded-2xl overflow-hidden border bg-white">
        <iframe
          title="Map"
          className="w-full h-[340px]"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.352081344065!2d106.700423!3d10.785559!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752929c6f0e6b1%3A0x4d3a4a285c1f6c1!2sDistrict%201%2C%20Ho%20Chi%20Minh%20City!5e0!3m2!1sen!2svi!4v1680000000000"
        />
      </div>
    </section>
  );
}
