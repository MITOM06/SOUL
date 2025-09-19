'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from "@/contexts/CartContext";


export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster />
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
