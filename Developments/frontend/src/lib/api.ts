// frontend/src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Tạo instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor để tự động thêm token
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor để xử lý response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, redirect về login
      Cookies.remove('auth_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
};

// Categories API
export const categoriesAPI = {
  getAll: (params?: { type?: string; search?: string }) =>
    api.get('/categories', { params }),
  
  getById: (id: number) => api.get(`/categories/${id}`),
  
  create: (data: FormData) => 
    api.post('/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: number, data: FormData) =>
    api.put(`/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (params?: {
    category_id?: number;
    type?: string;
    search?: string;
    subscription_level?: string;
    page?: number;
    limit?: number;
  }) => api.get('/products', { params }),
  
  getById: (id: number) => api.get(`/products/${id}`),
  
  create: (data: FormData) =>
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: number, data: FormData) =>
    api.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id: number) => api.delete(`/products/${id}`),
  
  download: (id: number, fileId: number) =>
    api.get(`/products/${id}/download/${fileId}`, {
      responseType: 'blob'
    }),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  
  getById: (id: number) => api.get(`/orders/${id}`),
  
  create: (data: {
    product_ids: number[];
    payment_method: string;
  }) => api.post('/orders', data),
  
  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};