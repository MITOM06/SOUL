"use client";

import { useEffect, useState } from "react";
import { profileAPI } from "@/lib/api";

export default function ProfileForm() {
  const [form, setForm] = useState({
    id: "",
    username: "",
    email: "",
    name: "",
    dob: "",
    gender: "",
  });

  // ✅ Lấy profile từ API khi load
  useEffect(() => {
    profileAPI.get().then((res) => {
      const u = res.data.data;
      setForm({
        id: u.id ?? "",
        username: u.username ?? "",
        email: u.email ?? "",
        name: u.name ?? "",
        dob: u.dob ?? "",
        gender: u.gender ?? "",
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await profileAPI.update({
        name: form.name,
        dob: form.dob,
        gender: form.gender,
      });
      alert("Profile updated!");
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleCancel = () => {
    window.location.reload();
  };

  return (
    <div className="flex gap-8">
      {/* Form bên trái */}
      <div className="flex-1 space-y-4">
        {/* ID - readonly */}
        <div>
          <label className="block mb-1">User Id:</label>
          <input
            name="id"
            value={form.id}
            readOnly
            className="border w-full p-2 rounded bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Email - readonly */}
        <div>
          <label className="block mb-1">Email:</label>
          <input
            name="email"
            type="email"
            value={form.email}
            readOnly
            className="border w-full p-2 rounded bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Full name - editable */}
        <div>
          <label className="block mb-1">Full Name:</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border w-full p-2 rounded"
          />
        </div>

        {/* DOB + Gender */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1">DOB:</label>
            <input
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              className="border w-full p-2 rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Gender:</label>
            <input
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="border w-full p-2 rounded"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Update
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Avatar bên phải */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 rounded-full border flex items-center justify-center text-gray-500">
          Avatar
        </div>
        <button className="mt-4 px-4 py-2 border rounded">
          Change Avatar
        </button>
      </div>
    </div>
  );
}
