"use client";

import { useState } from "react";
import { profileAPI } from "@/lib/api";

export default function SecurityPage() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await profileAPI.changePassword(form);
      setMessage("✅ Password updated successfully!");
      setForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Error changing password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-xl font-semibold mb-4">Account & Security</h2>

      {message && (
        <div
          className={`p-2 rounded ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <label className="block mb-1">Current Password</label>
        <input
          type="password"
          name="current_password"
          value={form.current_password}
          onChange={handleChange}
          className="border w-full p-2 rounded"
        />
      </div>

      <div>
        <label className="block mb-1">New Password</label>
        <input
          type="password"
          name="new_password"
          value={form.new_password}
          onChange={handleChange}
          className="border w-full p-2 rounded"
        />
      </div>

      <div>
        <label className="block mb-1">Confirm New Password</label>
        <input
          type="password"
          name="new_password_confirmation"
          value={form.new_password_confirmation}
          onChange={handleChange}
          className="border w-full p-2 rounded"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}
