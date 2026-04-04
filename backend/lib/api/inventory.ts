import { apiRequest } from '@/lib/api/client';
import type {
  ActivityLog,
  AdminUsersResponse,
  Category,
  DashboardSummary,
  Order,
  PaginatedResponse,
  Product,
  RestockItem,
} from '@/types/inventory';

export const inventoryApi = {
  getDashboardSummary: () => apiRequest<DashboardSummary>('/dashboard/summary'),
  getActivity: (limit = 10) => apiRequest<ActivityLog[]>(`/activity?limit=${limit}`),

  getCategories: (search = '') =>
    apiRequest<Category[]>(`/categories${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createCategory: (payload: { name: string; description?: string }) =>
    apiRequest<Category>('/categories', { method: 'POST', payload }),
  updateCategory: (categoryId: string, payload: { name?: string; description?: string }) =>
    apiRequest<Category>(`/categories/${categoryId}`, { method: 'PATCH', payload }),
  deleteCategory: (categoryId: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/categories/${categoryId}`, { method: 'DELETE' }),

  getProducts: (query: { search?: string; page?: number; limit?: number; categoryId?: string; status?: string }) => {
    const searchParams = new URLSearchParams();

    if (query.search) searchParams.set('search', query.search);
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));
    if (query.categoryId) searchParams.set('categoryId', query.categoryId);
    if (query.status) searchParams.set('status', query.status);

    const qs = searchParams.toString();
    return apiRequest<PaginatedResponse<Product>>(`/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (productId: string) => apiRequest<Product>(`/products/${productId}`),
  createProduct: (payload: {
    name: string;
    sku?: string;
    brand?: string;
    description?: string;
    categoryId: string;
    price: number;
    stock: number;
    minThreshold: number;
  }) => apiRequest<Product>('/products', { method: 'POST', payload }),
  updateProduct: (
    productId: string,
    payload: {
      name?: string;
      sku?: string;
      brand?: string;
      description?: string;
      categoryId?: string;
      price?: number;
      stock?: number;
      minThreshold?: number;
    },
  ) => apiRequest<Product>(`/products/${productId}`, { method: 'PATCH', payload }),
  deleteProduct: (productId: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/products/${productId}`, { method: 'DELETE' }),

  getOrders: (query: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (query.status) searchParams.set('status', query.status);
    if (query.fromDate) searchParams.set('fromDate', query.fromDate);
    if (query.toDate) searchParams.set('toDate', query.toDate);
    if (query.page) searchParams.set('page', String(query.page));
    if (query.limit) searchParams.set('limit', String(query.limit));

    const qs = searchParams.toString();
    return apiRequest<PaginatedResponse<Order>>(`/orders${qs ? `?${qs}` : ''}`);
  },
  createOrder: (payload: {
    customerName: string;
    items: Array<{ productId: string; quantity: number }>;
  }) => apiRequest<Order>('/orders', { method: 'POST', payload }),
  updateOrderStatus: (orderId: string, payload: { status: string }) =>
    apiRequest<Order>(`/orders/${orderId}/status`, { method: 'PATCH', payload }),

  getRestockQueue: () => apiRequest<RestockItem[]>('/restock-queue'),
  restockProduct: (productId: string, quantity: number) =>
    apiRequest<Product & { inQueue: boolean }>(`/restock-queue/${productId}/restock`, {
      method: 'PATCH',
      payload: { quantity },
    }),

  adminListUsers: () => apiRequest<AdminUsersResponse>('/admin/users'),
  adminUpdateUserRole: (userId: string, role: 'admin' | 'manager') =>
    apiRequest<{ id: string; name: string; email: string; role: 'admin' | 'manager' }>(
      `/admin/users/${userId}/role`,
      {
        method: 'PATCH',
        payload: { role },
      },
    ),
  adminSeedReset: () =>
    apiRequest<{
      message: string;
      users: number;
      categories: number;
      products: number;
      orders: number;
      orderItems: number;
      activityLogs: number;
      loginUsers: Array<{ email: string; password: string; role: 'admin' | 'manager' }>;
    }>('/admin/seed-reset', { method: 'POST' }),
};
