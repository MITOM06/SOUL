// frontend/src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'; // đổi localhost -> 127.0.0.1
// const API_ROOT = API_URL.replace(/\/api\/?$/, ''); // <-- Không còn dùng, có thể xoá

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // đúng cho token-based
});

// interceptor giữ nguyên…
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response?.status === 401 && error.config.url !== '/v1/user') {
      Cookies.remove('auth_token');
      const path = window.location.pathname;
      if (!path.startsWith('/auth')) {
        const next = encodeURIComponent(path + window.location.search);
        window.location.replace(`/auth/login?next=${next}`);
      }
    }
    return Promise.reject(error);
  }
);
export default api;

// ======================= AUTH =======================
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    return api.post('/v1/login', credentials); // đúng
  },
  register: async (userData: {
    name?: string;
    email: string;
    password: string;
    password_confirmation?: string;
  }) => api.post('/v1/register', userData), // đúng
  logout: async () => api.post('/v1/logout', {}), // đúng (cần Bearer)
  me: () => api.get('/v1/user'), // đúng
};

// ======================= CATEGORIES =======================
export const categoriesAPI = {
  getAll: (params?: { type?: string; search?: string }) =>
    api.get('/v1/categories', { params }), // thêm /v1
  getById: (id: number) => api.get(`/v1/categories/${id}`), // thêm /v1
  create: (data: FormData) =>
    api.post('/v1/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id: number, data: FormData) =>
    api.put(`/v1/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: number) => api.delete(`/v1/categories/${id}`),
};

// ======================= PRODUCTS =======================
export const productsAPI = {
  getAll: (params?: {
    category_id?: number;
    type?: string;
    search?: string;
    subscription_level?: string;
    page?: number;
    limit?: number;
  }) => api.get('/v1/products', { params }), // thêm /v1
  getById: (id: number) => api.get(`/v1/products/${id}`), // thêm /v1
  create: (data: FormData) =>
    api.post('/v1/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id: number, data: FormData) =>
    api.put(`/v1/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id: number) => api.delete(`/v1/products/${id}`),
  // Sửa URL tải file: backend là /v1/products/{product}/files/{file}/download
  download: (id: number, fileId: number) =>
    api.get(`/v1/products/${id}/files/${fileId}/download`, { responseType: 'blob' }),
};

// ======================= ORDERS =======================
export const ordersAPI = {
  getAll: () => api.get('/v1/orders'), // thêm /v1
  getById: (id: number) => api.get(`/v1/orders/${id}`), // nếu có endpoint
  create: (data: { product_ids: number[]; payment_method: string; }) =>
    api.post('/v1/orders', data), // nếu backend là /v1/orders (store)
  updateStatus: (id: number, status: string) =>
    api.put(`/v1/orders/${id}/status`, { status }), // nếu có endpoint
  // 👇 thêm mới
  updateItemQuantity: (itemId: number, quantity: number) =>
    api.put(`/v1/orders/items/${itemId}`, { quantity }),

  deleteItem: (itemId: number) =>
    api.delete(`/v1/orders/items/${itemId}`),

};

// ======================= ADMIN ORDERS =======================
export const adminOrdersAPI = {
  getAll: () => api.get('/v1/admin/orders'), 
  getById: (id: number) => api.get(`/v1/admin/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    api.put(`/v1/admin/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/v1/admin/orders/${id}`),
};

// ======================= ADMIN ORDER ITEM =======================
export const adminOrderItemsAPI = {
  delete: (itemId: number) => api.delete(`/v1/admin/orders/items/${itemId}`),
};