'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

type User = {
  id: number;
  name?: string | null;
  email: string;
  role?: string;
  is_active?: boolean;
  subscription_level?: string;
};

type RegisterPayload = {
  name?: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type Credentials = { email: string; password: string };

type AuthContextType = {
  user: User | null;
  subscriptionLevel: string;
  isLoading: boolean;
  register: (p: RegisterPayload) => Promise<boolean>;
  login: (cred: Credentials, opts?: { silent?: boolean; noRedirect?: boolean }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionLevel, setSubscriptionLevel] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Khởi động: nếu có token thì lấy user
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const data = res.data;
      if (data?.success && data?.data) {
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          is_active: data.data.is_active,
          subscription_level: data.data.subscription_level,
        });
        if (data.data.subscription_level) {
          setSubscriptionLevel(data.data.subscription_level);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  // 👉 ĐĂNG KÝ: nhận token + user, set luôn trạng thái đăng nhập
  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const res = await authAPI.register(payload);
      const data = res.data;

      if ((res.status === 200 || res.status === 201) && data?.success) {
        // Nếu backend trả token + user
        if (data?.data?.token) {
          Cookies.set('auth_token', data.data.token, { sameSite: 'lax' });
        }
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          is_active: data.data.is_active,
        });
        if (data.data.subscription_level) setSubscriptionLevel(data.data.subscription_level);

        toast.success('Registration successful!');
        return true;
      }

      toast.error(data?.message || 'Registration failed');
      return false;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // (giữ để dùng cho form login bình thường, có thể silent)
  const login = async (cred: Credentials, opts?: { silent?: boolean; noRedirect?: boolean }): Promise<boolean> => {
    try {
      const res = await authAPI.login(cred);
      const data = res.data;

      if (res.status === 200 && data?.success) {
        if (data?.data?.token) {
          Cookies.set('auth_token', data.data.token, { sameSite: 'lax' });
        }
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          is_active: data.data.is_active,
        });
        if (data.data.subscription_level) setSubscriptionLevel(data.data.subscription_level);

        if (!opts?.silent) toast.success('Login successful!');
        return true;
      }

      if (!opts?.silent) toast.error(data?.message || 'Invalid credentials');
      return false;
    } catch (err: any) {
      if (!opts?.silent) toast.error(err?.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    } finally {
      Cookies.remove('auth_token');
      setUser(null);
      setSubscriptionLevel('free');
      toast.success('Logged out');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, subscriptionLevel, isLoading, register, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
