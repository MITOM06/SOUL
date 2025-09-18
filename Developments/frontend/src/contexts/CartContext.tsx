"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { cartAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext"; // 👈 import

type CartContextType = {
  count: number;
  refresh: () => void;
  setCount: (n: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const { user } = useAuth(); // 👈 lấy user từ AuthContext

  const refresh = () => {
    if (!user || user.role === "admin") {
      // Nếu chưa login hoặc là admin thì không cần cart
      setCount(0);
      return;
    }

    cartAPI
      .getCount()
      .then((res) => setCount(res.data.count))
      .catch(() => setCount(0));
  };

  useEffect(() => {
    refresh(); // chạy lại mỗi khi user thay đổi
  }, [user]);

  return (
    <CartContext.Provider value={{ count, refresh, setCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
