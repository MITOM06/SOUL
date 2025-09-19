// frontend/src/components/Layout.tsx
import React from 'react';
import { CartProvider } from '@/contexts/CartContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <CartProvider> {/* 👈 bọc toàn bộ */}
      <div className="min-h-screen flex flex-col">
        {/* Header và Nav nằm đây cũng dùng được useCart */}
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </CartProvider>
  );
};

export default Layout;