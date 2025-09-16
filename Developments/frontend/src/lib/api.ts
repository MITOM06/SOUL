// frontend/src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
// API root without the /api suffix (used to call sanctum csrf endpoint)
const API_ROOT = API_URL.replace(/\/api\/?$/, '');

// Tạo instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // allow sending/receiving cookies for session-based auth (Sanctum)
  withCredentials: true,
});

// Interceptor để tự động thêm token
// We rely on cookie-based session authentication (Laravel Sanctum).
// Keep the request interceptor in case an auth token exists, but do not require it.
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers = config.headers || {};
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
      // Cookies.remove('auth_token');
      // window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  // Ensure CSRF cookie (Sanctum) is present before stateful auth requests
  ensureCsrf: () => axios.get(`${API_ROOT}/sanctum/csrf-cookie`, { withCredentials: true }),

  // Backend routes use /v1/* under /api prefix (e.g. /api/v1/login)
  login: async (credentials: { email: string; password: string }) => {
    await axios.get(`${API_ROOT}/sanctum/csrf-cookie`, { withCredentials: true });
    return api.post('/v1/login', credentials, { withCredentials: true });
  },

  register: async (userData: {
    name?: string;
    email: string;
    password: string;
    password_confirmation?: string;
  }) => {
    await axios.get(`${API_ROOT}/sanctum/csrf-cookie`, { withCredentials: true });
    return api.post('/v1/register', userData);
  },

  logout: async () => {
    await axios.get(`${API_ROOT}/sanctum/csrf-cookie`, { withCredentials: true });
    return api.post('/v1/logout');
  },

  // Get current authenticated user
  me: () => api.get('/v1/user'),
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