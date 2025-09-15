export type AccessLevel = 'free'|'basic'|'premium'|'vip'

export interface Book {
  id: number
  title: string
  author?: string
  cover?: string
  description?: string
  category?: string
  access_level?: AccessLevel
  content_preview?: string
}

export interface Podcast {
  id: number
  title: string
  host?: string
  cover?: string
  description?: string
  category?: string
  audio_url?: string
  access_level?: AccessLevel
}

// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  // thêm các field khác nếu backend trả về
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// 👇 Thêm cái này để fix lỗi
export interface AuthResponse {
  access_token: string;
  user: User;
  subscription_level: string; // free | premium
}
