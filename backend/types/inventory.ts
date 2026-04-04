export type ProductStatus = 'active' | 'out_of_stock';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  price: string;
  stock: number;
  minThreshold: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: string;
}

export interface Order {
  id: string;
  customerName: string;
  userId: string;
  status: OrderStatus;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface RestockItem {
  id: string;
  name: string;
  stock: number;
  minThreshold: number;
  status: ProductStatus;
  priority: 'high' | 'medium' | 'low';
  updatedAt: string;
}

export interface DashboardSummary {
  totalOrdersToday: number;
  pendingOrders: number;
  completedOrders: number;
  revenueToday: number;
  lowStockItemsCount: number;
  productSummary: Array<{
    id: string;
    name: string;
    stock: number;
    minThreshold: number;
    status: ProductStatus;
    label: 'Low Stock' | 'OK';
  }>;
  orderRevenueChart: Array<{
    hour: string;
    totalOrders: number;
    revenue: number;
  }>;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
  createdAt: string;
}

export interface AdminUsersResponse {
  roles: Array<{ role: 'admin' | 'manager'; count: number }>;
  employees: EmployeeUser[];
}
