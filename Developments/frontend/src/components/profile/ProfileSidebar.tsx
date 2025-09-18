"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { label: "My account", href: "/profile" },
  { label: "Personal library", href: "/profile/library" },
  { label: "Order History", href: "/profile/order" },
  { label: "Transaction history", href: "/profile/transactions" },
  // 👇 Customer service không có href, sẽ mở modal
  { label: "Customer service", href: null },
  { label: "Account Settings & Security", href: "/profile/security" },
];

export default function ProfileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="w-64 border-r p-4 space-y-2">
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={`block border p-2 rounded ${
                pathname === item.href ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.label}
              onClick={() => setOpen(true)}
              className="block w-full text-left border p-2 rounded hover:bg-gray-100"
            >
              {item.label}
            </button>
          )
        )}
      </aside>

      {/* Modal cho Customer Service */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Customer Service</h2>
            <p className="mb-2">📧 support@example.com</p>
            <p className="mb-2">📞 +84 123 456 789</p>
            <p className="text-gray-600">We are here to help you 24/7!</p>
          </div>
        </div>
      )}
    </>
  );
}
