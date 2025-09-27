'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from "@/contexts/CartContext";
import { useAuth } from '@/contexts/AuthContext';

function InactiveOverlay() {
  const { user, logout } = useAuth();
  if (!user || user.is_active !== false) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="text-2xl font-bold text-red-600">Account Restricted</div>
        <p className="mt-3 text-sm text-zinc-700">
          Bạn đã bị vi phạm tiêu chuẩn cộng đồng. Tài khoản hiện đang bị tạm khóa.
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          Vui lòng liên hệ hỗ trợ qua số: <span className="font-semibold">(+84) 0900-123-456</span>
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


export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster />
      <CartProvider>
        {children}
        <InactiveOverlay />
      </CartProvider>
    </AuthProvider>
  );
}
