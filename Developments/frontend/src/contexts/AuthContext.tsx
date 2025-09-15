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
      const data: ApiResponse<AuthResponse> = response.data;
      
      if (data.success && data.data) {
        // Lưu token
        Cookies.set('auth_token', data.data.access_token, { expires: 7 });
        
        // Set user state
        setUser(data.data.user);
        setSubscriptionLevel(data.data.subscription_level);
        
        toast.success('Đăng nhập thành công!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    try {
      const response = await authAPI.register(userData);
      const data: ApiResponse<AuthResponse> = response.data;
      
      if (data.success && data.data) {
        // Lưu token
        Cookies.set('auth_token', data.data.access_token, { expires: 7 });
        
        // Set user state
        setUser(data.data.user);
        setSubscriptionLevel(data.data.subscription_level);
        
        toast.success('Đăng ký thành công!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
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
      toast.success('Đăng xuất thành công');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      const data: ApiResponse<{ user: User; subscription_level: string }> = response.data;
      
      if (data.success && data.data) {
        setUser(data.data.user);
        setSubscriptionLevel(data.data.subscription_level);
      }
    } catch (error) {
      Cookies.remove('auth_token');
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