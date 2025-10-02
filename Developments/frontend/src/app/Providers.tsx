'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from "@/contexts/CartContext";
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

function InactiveOverlay() {
  const { user, logout } = useAuth();
  if (!user || user.is_active !== false) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="text-2xl font-bold text-red-600">Account Temporarily Locked</div>
        <p className="mt-3 text-sm text-zinc-700">
          Your account has been temporarily locked for violating community standards.
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          Please contact our support at <span className="font-semibold">(+84) 0900-123-456</span> for assistance.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function SuspendedNotice() {
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const m = localStorage.getItem('susp_notice');
      if (m) setMsg(m);
      const onStorage = (e: StorageEvent) => {
        if (e.key === 'susp_notice') setMsg(e.newValue);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    } catch {
      // ignore
    }
  }, []);

  if (!msg) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="text-2xl font-bold text-red-600">Account Temporarily Locked</div>
        <p className="mt-3 text-sm text-zinc-700">{msg}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => {
              try { localStorage.removeItem('susp_notice'); } catch {}
              setMsg(null);
            }}
            className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster />
      <CartProvider>
        {children}
        <InactiveOverlay />
        <SuspendedNotice />
      </CartProvider>
    </AuthProvider>
  );
}
