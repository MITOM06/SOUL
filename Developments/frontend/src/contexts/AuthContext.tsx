'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiResponse, AuthResponse } from '@/types';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  subscriptionLevel: string;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionLevel, setSubscriptionLevel] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token khi load trang
useEffect(() => {
  const token = Cookies.get('auth_token');
  if (token) {
    refreshUser();
  } else {
    setIsLoading(false);
  }
}, []);


  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);
      const data: ApiResponse<any> = response.data;

      const success = (response.status === 200 || response.status === 201) && data && data.success;

if (success) {
  // LẤY TOKEN và LƯU LẠI
  if (data.data?.token) {
    // giữ đơn giản, token trong cookie
    Cookies.set('auth_token', data.data.token, { sameSite: 'lax' });
  }

  if (data?.data?.token) {
  Cookies.set('auth_token', data.data.token, { sameSite: 'lax' }); // lưu token
}

  setUser({
    id: data.data.id,
    name: data.data.name,
    email: data.data.email,
    role: data.data.role,
  });

  if (data.data.subscription_level) setSubscriptionLevel(data.data.subscription_level);

  toast.success('Login successful!');
  return true;
}

      if ((response.status === 200 || response.status === 201) && data && data.success) {
        // Backend uses session cookie (Sanctum). We don't expect access_token.
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
        });
        // subscription_level may not exist; keep default if absent
        if (data.data.subscription_level) setSubscriptionLevel(data.data.subscription_level);
        toast.success('Login successful!');
        return true;
      }
      // If backend returns success=false or no data, surface message
      toast.error(data?.message || 'Login failed');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData: {
    name?: string;
    email: string;
    password: string;
    password_confirmation?: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      const data: ApiResponse<any> = response.data;

      if ((response.status === 200 || response.status === 201) && data && data.success) {
        // Backend created user; do not assume an access token is returned.
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
        });
        if (data.data.subscription_level) setSubscriptionLevel(data.data.subscription_level);
        toast.success('Registration successful!');
        return true;
      }
      toast.error(data.message || 'Registration failed');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore error
    } finally {
      Cookies.remove('auth_token');
      setUser(null);
      setSubscriptionLevel('free');
      toast.success('Logged out');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      const data: ApiResponse<any> = response.data;

      if (response.status === 200 && data.success && data.data) {
        // Backend returns user object in data
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
        });
        if (data.data.subscription_level) setSubscriptionLevel(data.data.subscription_level);
      } else {
        Cookies.remove('auth_token');
        setUser(null);
      }
    } catch (error) {
      Cookies.remove('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      subscriptionLevel,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}