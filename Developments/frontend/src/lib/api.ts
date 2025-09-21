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

  withCredentials: false, // token-based (Bearer)

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

/* ======================= AUTH ======================= */
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/v1/login', credentials),
  register: (userData: { name?: string; email: string; password: string; password_confirmation?: string }) =>
    api.post('/v1/register', userData),
  logout: () => api.post('/v1/logout', {}),
  me: () => api.get('/v1/user'),
};

/* ======================= CATEGORIES ======================= */
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

/* ======================= PRODUCTS ======================= */
export const productsAPI = {
  getAll: (params?: {
    category_id?: number;
    type?: string;
    search?: string;
    subscription_level?: string;
    page?: number;
    limit?: number;
  }) => api.get('/v1/products', { params }),
  getById: (id: number) => api.get(`/v1/products/${id}`),
  create: (data: FormData) =>
    api.post('/v1/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) =>
    api.put(`/v1/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/v1/products/${id}`),
  download: (id: number, fileId: number) =>
    api.get(`/v1/products/${id}/files/${fileId}/download`, { responseType: 'blob' }),
};

/* ======================= PROFILE ======================= */
export const profileAPI = {
  get: () => api.get('/v1/profile'),
  update: (data: { name?: string; email?: string; dob?: string; gender?: string }) =>
    api.put('/v1/profile', data),
  changePassword: (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => api.put('/v1/profile/password', data),
};

/* ======================= TRANSACTIONS / PAYMENTS ======================= */
export const transactionsAPI = {
  getAll: () => api.get('/v1/transactions'),
  getById: (id: number) => api.get(`/v1/transactions/${id}`),
};

/* ======================= LIBRARY ======================= */
export const libraryAPI = {
  getAll: (params?: { type?: 'ebook'|'podcast'; search?: string; category?: string }) =>
    api.get('/v1/library', { params }),
};
//======================== PAYMENTS =======================
export const paymentsAPI = {
  initCheckout: (orderId: number, provider: string) =>
    api.post(`/v1/payment/checkout`, { order_id: orderId, provider }),

  confirmOtp: (paymentId: number, otp: string) =>
  api.post(`/v1/payments/${paymentId}/confirm-otp`, { otp }),

  getById: (paymentId: number) =>  // 👈 thêm hàm này
    api.get(`/v1/payments/${paymentId}`),
    // Lấy toàn bộ lịch sử payment (hoặc theo order_id nếu cần)
  getAll: (orderId?: number) => {
    if (orderId) {
      return api.get(`/v1/payment-history?order_id=${orderId}`);
    }
    return api.get('/v1/payment-history');
  },
};
/* ======================= ORDERS ======================= */
export const ordersAPI = {
  getAll: () => api.get('/v1/orders'),
  getById: (id: number) => api.get(`/v1/orders/${id}`),
  create: (data: { product_ids: number[]; payment_method: string }) =>
    api.post('/v1/orders', data),
  update: (id: number, data: any) => api.put(`/v1/orders/${id}`, data),
  updateItemQuantity: (itemId: number, quantity: number) =>
    api.put(`/v1/orders/items/${itemId}`, { quantity }),
  deleteItem: (itemId: number) => api.delete(`/v1/orders/items/${itemId}`),
  checkout: (orderId: number) => api.post('/v1/orders/checkout', { order_id: orderId }),
};

/* ======================= CART ======================= */
export const cartAPI = {
  getCount: () => api.get('/v1/cart/count'),
  getCart: () => api.get('/v1/cart'),
  add: (productId: number, qty = 1) =>
    api.post('/v1/orders/items', { product_id: productId, quantity: qty }),
  remove: (itemId: number) => api.delete(`/v1/orders/items/${itemId}`),
};

/* ======================= ADMIN ORDERS ======================= */
export const adminOrdersAPI = {
  getAll: () => api.get('/v1/admin/orders'),
  getById: (id: number) => api.get(`/v1/admin/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    api.put(`/v1/admin/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/v1/admin/orders/${id}`),
};

/* ======================= ADMIN ORDER ITEMS ======================= */
export const adminOrderItemsAPI = {
  delete: (itemId: number) => api.delete(`/v1/admin/orders/items/${itemId}`),
};

/* ======================= ADMIN USERS ======================= */
export const adminUsersAPI = {
  getAll: ({ page = 1, role, per_page = 15 }: { page?: number; role?: 'user' | 'admin'; per_page?: number }) =>
    api.get('/v1/admin/users', { params: { page, role, per_page } }),
  create: (data: any) => api.post('/v1/admin/users', data),
  update: (id: number, data: any) => api.put(`/v1/admin/users/${id}`, data),
  delete: (id: number) => api.delete(`/v1/admin/users/${id}`),
};

/* =======================================================================
 * ======================= USERS SUBSCRIPTIONS ============================
 * =======================================================================
 *  - User: tự tạo / xem / xoá subscription của chính mình
 *  - Admin: CRUD trên bảng user_subscriptions
 *  Lưu ý: backend dùng cột DB là `plan_key` (basic|premium|vip).
 *  Controller chấp nhận cả `plan` lẫn `plan_key`; FE nên gửi `plan_key`.
 */

/* -------- User subscriptions (yêu cầu đăng nhập) -------- */
export const userSubscriptionsAPI = {
  // Danh sách subscriptions của chính user
  getAll: () => api.get('/v1/subscriptions'),

  // Tạo subscription mới theo 1 trong 3 gói
  create: (
    payload:
      | { plan_key: 'basic' | 'premium' | 'vip' }
      | { plan: 'basic' | 'premium' | 'vip' }
  ) => api.post('/v1/subscriptions', payload),

  // Huỷ subscription của chính mình
  delete: (id: number) => api.delete(`/v1/subscriptions/${id}`),
};

/* -------- Admin subscriptions CRUD (yêu cầu quyền admin) -------- */
export const adminUserSubscriptionsAPI = {
  getAll: () => api.get('/v1/admin/users-sub'),
  getById: (id: number) => api.get(`/v1/admin/users-sub/${id}`),

  // Tạo: bắt buộc user_id + plan_key + status
  create: (payload: {
    user_id: number;
    plan_key: 'basic' | 'premium' | 'vip'; // hoặc gửi 'plan'
    status: 'active' | 'canceled' | 'expired';
    start_date?: string | null;
    end_date?: string | null;
    price_cents?: number | null;
    payment_id?: number | null;
  }) => api.post('/v1/admin/users-sub', payload),

  // Cập nhật: gửi phần muốn sửa
  update: (
    id: number,
    payload: Partial<{
      plan_key: 'basic' | 'premium' | 'vip'; // hoặc 'plan'
      status: 'active' | 'canceled' | 'expired';
      start_date: string | null;
      end_date: string | null;
      price_cents: number | null;
      payment_id: number | null;
    }>
  ) => api.put(`/v1/admin/users-sub/${id}`, payload),

  // Xoá
  delete: (id: number) => api.delete(`/v1/admin/users-sub/${id}`),
};

/* ======================= FAVOURITES (USER) ======================= */
export const favouritesAPI = {
  /** Lấy danh sách favourite của user hiện tại (books, podcasts, product_ids). */
  getAll: () => api.get('/v1/favourites'),

  /** Thêm favourite (idempotent). */
  add: (productId: number) =>
    api.post('/v1/favourites', { product_id: productId }),

  /** Toggle favourite (trả về { on: true|false }). */
  toggle: (productId: number) =>
    api.post('/v1/favourites/toggle', { product_id: productId }),

  /** Xóa favourite theo productId (idempotent). */
  remove: (productId: number) =>
    api.delete(`/v1/favourites/${productId}`),
};

// ======================= ADMIN PAYMENTS =======================
export const adminPaymentsAPI = {
   getAll: (params?: any) =>
  api.get("/v1/admin/payments", { params }),
  getById: (id: number) => api.get(`/v1/admin/payments/${id}`),
  delete: (id: number) => api.delete(`/v1/admin/payments/${id}`),
};