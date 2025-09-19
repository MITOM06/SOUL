"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cartAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";  // 👈 lấy user

interface CartContextType {
  count: number;
  refresh: () => Promise<void>;
  reset: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const { user } = useAuth();   // 👈 lấy user từ context

  const refresh = async () => {
    try {
      const res = await cartAPI.getCount();
      setCount(res.data.count ?? 0);
    } catch (err) {
      console.error("Failed to refresh cart count:", err);
      setCount(0);
    }
  };

  const reset = () => setCount(0);

  // 👉 mỗi khi user thay đổi (login/logout) thì gọi refresh/reset
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      reset();
    }
  }, [user]);

  return (
    <CartContext.Provider value={{ count, refresh, reset }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
