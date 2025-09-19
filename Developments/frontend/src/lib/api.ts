// frontend/src/lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // token-based
});

// ===== Interceptors =====
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
  login: (credentials: { email: string; password: string }) =>
    api.post('/v1/login', credentials),
  register: (userData: { name?: string; email: string; password: string; password_confirmation?: string }) =>
    api.post('/v1/register', userData),
  logout: () => api.post('/v1/logout', {}),
  me: () => api.get('/v1/user'),
};

// ======================= CATEGORIES =======================
export const categoriesAPI = {
  getAll: (params?: { type?: string; search?: string }) =>
    api.get('/v1/categories', { params }),
  getById: (id: number) => api.get(`/v1/categories/${id}`),
  create: (data: FormData) =>
    api.post('/v1/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    api.put(`/v1/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/v1/categories/${id}`),
};

// ======================= PRODUCTS =======================
export const productsAPI = {
  getAll: (params?: { category_id?: number; type?: string; search?: string; subscription_level?: string; page?: number; limit?: number }) =>
    api.get('/v1/products', { params }),
  getById: (id: number) => api.get(`/v1/products/${id}`),
  create: (data: FormData) =>
    api.post('/v1/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    api.put(`/v1/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/v1/products/${id}`),
  download: (id: number, fileId: number) =>
    api.get(`/v1/products/${id}/files/${fileId}/download`, { responseType: 'blob' }),
};

// ======================= PROFILE =======================
export const profileAPI = {
  get: () => api.get('/v1/profile'),
  update: (data: { name?: string; email?: string; dob?: string; gender?: string }) =>
    api.put('/v1/profile', data),
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
    api.put('/v1/profile/password', data),
};

// ======================= TRANSACTIONS =======================
export const transactionsAPI = {
  getAll: () => api.get('/v1/transactions'),
  getById: (id: number) => api.get(`/v1/transactions/${id}`),
};
export const paymentsAPI = {
  initCheckout: (orderId: number, provider = "fake") =>
    api.post("/v1/payment/checkout", { order_id: orderId, provider }),
};


// ======================= ORDERS =======================
export const ordersAPI = {
  getAll: () => api.get('/v1/orders'),
  getById: (id: number) => api.get(`/v1/orders/${id}`),
  create: (data: { product_ids: number[]; payment_method: string }) =>
    api.post('/v1/orders', data),
  update: (id: number, data: any) =>
    api.put(`/v1/orders/${id}`, data), // ✅ khớp với backend
  updateItemQuantity: (itemId: number, quantity: number) =>
    api.put(`/v1/orders/items/${itemId}`, { quantity }),
  deleteItem: (itemId: number) => api.delete(`/v1/orders/items/${itemId}`),
  checkout: (orderId: number) =>
    api.post('/v1/orders/checkout', { order_id: orderId }),
}
// ======================= CART =======================
export const cartAPI = {
  getCount: () => api.get('/v1/cart/count'),
  getCart: () => api.get('/v1/cart'),
};


// ======================= ADMIN ORDERS =======================
export const adminOrdersAPI = {
  getAll: () => api.get('/v1/admin/orders'),
  getById: (id: number) => api.get(`/v1/admin/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    api.put(`/v1/admin/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/v1/admin/orders/${id}`),
};

// ======================= ADMIN ORDER ITEMS =======================
export const adminOrderItemsAPI = {
  delete: (itemId: number) => api.delete(`/v1/admin/orders/items/${itemId}`),
};
