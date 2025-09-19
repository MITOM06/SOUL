"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cartAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface CartContextType {
  count: number;
  refresh: () => Promise<void>;
  reset: () => void;
  add: (productId: number, qty?: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

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

  const add = async (productId: number, qty = 1) => {
    try {
      await cartAPI.add(productId, qty);
      await refresh();
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const remove = async (productId: number) => {
    try {
      await cartAPI.remove(productId);
      await refresh();
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    }
  };

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      reset();
    }
  }, [user]);

  return (
    <CartContext.Provider value={{ count, refresh, reset, add, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
