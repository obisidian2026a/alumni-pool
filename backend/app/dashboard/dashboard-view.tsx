'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Edit3, Eye, ShoppingCart, Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { inventoryApi } from '@/lib/api/inventory';
import type {
  ActivityLog,
  Category,
  DashboardSummary,
  Order,
  Product,
  RestockItem,
} from '@/types/inventory';

export type DashboardTab =
  | 'live-overview'
  | 'products'
  | 'orders'
  | 'activity'
  | 'categories'
  | 'restock';

interface DashboardViewProps {
  activeTab: DashboardTab;
}

const PAGE_SIZE = 10;

export default function DashboardView({ activeTab }: DashboardViewProps) {
  const router = useRouter();
  const [userRole] = useState<'admin' | 'manager'>(() => {
    if (typeof window === 'undefined') {
      return 'manager';
    }

    const rawUser = localStorage.getItem('auth_user');
    if (!rawUser) {
      return 'manager';
    }

    try {
      const parsed = JSON.parse(rawUser) as { role?: 'admin' | 'manager' };
      return parsed.role === 'admin' ? 'admin' : 'manager';
    } catch {
      return 'manager';
    }
  });

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockQueue, setRestockQueue] = useState<RestockItem[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const isAdmin = userRole === 'admin';

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query)
      );
    });
  }, [categories, categorySearch]);

  const categoryTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  }, [filteredCategories]);

  const effectiveCategoryPage = Math.min(categoryPage, categoryTotalPages);

  const paginatedCategories = useMemo(() => {
    const start = (effectiveCategoryPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [effectiveCategoryPage, filteredCategories]);

  const loadDashboardData = useCallback(async () => {
    const [summaryData, categoryData, productData, orderData, queueData, activityData] =
      await Promise.all([
        inventoryApi.getDashboardSummary(),
        inventoryApi.getCategories(),
        inventoryApi.getProducts({ search: productSearch, page: productPage, limit: PAGE_SIZE }),
        inventoryApi.getOrders({ status: orderStatusFilter || undefined, page: orderPage, limit: PAGE_SIZE }),
        inventoryApi.getRestockQueue(),
        inventoryApi.getActivity(10),
      ]);

    setSummary(summaryData);
    setCategories(categoryData);
    setProducts(productData.data);
    setProductTotalPages(Math.max(1, productData.totalPages));
    setOrders(orderData.data);
    setOrderTotalPages(Math.max(1, orderData.totalPages));
    setRestockQueue(queueData);
    setActivity(activityData);
  }, [orderPage, orderStatusFilter, productPage, productSearch]);

  useEffect(() => {
    const token = localStorage.getItem('auth_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    const timer = window.setTimeout(() => {
      loadDashboardData()
        .catch((err: unknown) => {
          const message = err instanceof ApiError ? err.message : 'Failed to load dashboard';
          setError(message);
        })
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboardData, router]);

  async function refreshData() {
    try {
      await loadDashboardData();
      setError(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to refresh data';
      setError(message);
    }
  }

  async function handleDeleteCategory(category: Category) {
    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    try {
      await inventoryApi.deleteCategory(category.id);
      await refreshData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to delete category';
      setError(message);
    }
  }

  async function handleStatusUpdate(orderId: string, status: string) {
    try {
      await inventoryApi.updateOrderStatus(orderId, { status });
      await refreshData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to update order status';
      setError(message);
    }
  }

  async function handleRestock(productId: string) {
    const raw = window.prompt('Restock quantity', '5');
    if (!raw) return;
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError('Restock quantity must be at least 1');
      return;
    }

    try {
      await inventoryApi.restockProduct(productId, quantity);
      await refreshData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to restock product';
      setError(message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-line border-t-brand-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <>
          <div className="space-y-6">
            {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            {activeTab === 'live-overview' ? (
              <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard title="Total Orders Today" value={summary?.totalOrdersToday ?? 0} />
              <MetricCard title="Pending Orders" value={summary?.pendingOrders ?? 0} />
              <MetricCard title="Completed Orders" value={summary?.completedOrders ?? 0} />
              <MetricCard
                title="Revenue Today"
                value={`$${(summary?.revenueToday ?? 0).toFixed(2)}`}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card title="Product Summary Snapshot">
                <ul className="space-y-2 text-sm">
                  {summary?.productSummary.map((item) => (
                    <li key={item.id} className="rounded-md bg-brand-soft px-3 py-2 text-brand-ink">
                      {item.name} - {item.stock} left ({item.label})
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Restock Highlights">
                <p className="mb-2 text-sm text-brand-muted">
                  Low Stock Items: {summary?.lowStockItemsCount ?? 0}
                </p>
                <ul className="space-y-2 text-sm">
                  {restockQueue.slice(0, 8).map((item) => (
                    <li key={item.id} className="rounded-md border border-brand-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-brand-ink">{item.name}</span>
                        <span className="text-xs uppercase text-brand-muted">{item.priority}</span>
                      </div>
                      <p className="mt-1 text-brand-muted">
                        Stock {item.stock} / Threshold {item.minThreshold}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
              </>
            ) : null}

            {activeTab === 'categories' ? (
              <section>
                <Card title="Categories">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="w-full max-w-md">
                  <FieldLabel htmlFor="categorySearch" label="Search" />
                  <input
                    id="categorySearch"
                    placeholder="Search categories"
                    value={categorySearch}
                    onChange={(event) => {
                      setCategorySearch(event.target.value);
                      setCategoryPage(1);
                    }}
                    className="mt-1 w-full rounded-md border border-brand-line px-3 py-2 text-sm"
                  />
                </div>
                <button
                  onClick={() => router.push('/dashboard/categories/new')}
                  className="rounded-md border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink"
                >
                  Add Category
                </button>
              </div>

              <div className="mb-2 grid grid-cols-[64px_minmax(0,1fr)_auto] items-center rounded-md border border-brand-line bg-brand-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="text-center">No</span>
                <span>Category</span>
                <span>Actions</span>
              </div>

              <ul className="space-y-2 text-sm text-brand-muted">
                {paginatedCategories.map((category, index) => (
                  <li key={category.id} className="rounded-md border border-brand-line p-3">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3">
                      <div className="flex justify-center">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-brand-soft px-2 text-xs font-semibold text-brand-ink">
                          {(effectiveCategoryPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-brand-ink">{category.name}</p>
                        <p className="text-xs text-brand-muted">
                          {category.description?.trim() || 'No description'}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => router.push(`/dashboard/categories/${category.id}/edit`)}
                          aria-label="Edit category"
                          className="inline-flex items-center gap-2 border border-brand-line px-3 py-2 text-sm text-brand-ink"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          disabled={!isAdmin}
                          title={!isAdmin ? 'Only admin can manage categories' : undefined}
                          aria-label="Delete category"
                          className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-sm text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {!filteredCategories.length ? (
                  <li className="text-brand-muted">No categories found.</li>
                ) : null}
              </ul>

              {filteredCategories.length ? (
                <PaginationControls
                  page={effectiveCategoryPage}
                  totalPages={categoryTotalPages}
                  onPrevious={() => setCategoryPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setCategoryPage((prev) => Math.min(categoryTotalPages, prev + 1))}
                />
              ) : null}
                </Card>
              </section>
            ) : null}

            {activeTab === 'products' ? (
              <section>
                <Card title="Products">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="w-full max-w-md">
                  <FieldLabel htmlFor="productSearch" label="Search" />
                  <input
                    id="productSearch"
                    placeholder="Search products"
                    value={productSearch}
                    onChange={(event) => {
                      setProductSearch(event.target.value);
                      setProductPage(1);
                    }}
                    className="mt-1 w-full rounded-md border border-brand-line px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/dashboard/products/new')}
                    className="rounded-md border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink"
                  >
                    Add Product
                  </button>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-[64px_minmax(0,1fr)_auto] items-center rounded-md border border-brand-line bg-brand-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="text-center">No</span>
                <span>Product</span>
                <span>Actions</span>
              </div>

              <ul className="space-y-2 text-sm">
                {products.map((product, index) => (
                  <li key={product.id} className="rounded-md border border-brand-line p-3">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3">
                      <div className="flex justify-center">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-brand-soft px-2 text-xs font-semibold text-brand-ink">
                          {(productPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <Link href={`/dashboard/products/${product.id}`} className="font-medium text-brand-ink underline-offset-2 hover:underline">
                          {product.name}
                        </Link>
                        <p className="text-brand-muted">
                          {product.categoryName} | Stock: {product.stock} | Min: {product.minThreshold} | ${product.price}
                        </p>
                        <p className="text-xs text-brand-muted">
                          SKU: {product.sku || 'N/A'} | Brand: {product.brand || 'N/A'}
                        </p>
                        {product.description ? (
                          <p className="mt-1 text-xs text-brand-muted">{product.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          aria-label="Edit product"
                          className="inline-flex items-center gap-2 border border-brand-line px-3 py-2 text-sm text-brand-ink"
                        >
                          <Edit3 size={18} />
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="inline-flex items-center gap-2 rounded-md border border-brand-line px-3 py-2 text-sm text-brand-ink"
                        >
                          <Eye size={18} />
                          View
                        </Link>
                        {product.status === 'active' ? (
                          <Link
                            href={`/dashboard/orders/new?productId=${product.id}`}
                            className="inline-flex items-center gap-2 rounded-md border border-brand-line px-3 py-2 text-sm"
                          >
                            <ShoppingCart size={18} />
                            Order This
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-md border border-brand-line px-3 py-2 text-sm opacity-60">
                            <ShoppingCart size={18} />
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                {!products.length ? <li className="text-brand-muted">No products found.</li> : null}
              </ul>

              {products.length ? (
                <PaginationControls
                  page={productPage}
                  totalPages={productTotalPages}
                  onPrevious={() => setProductPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setProductPage((prev) => Math.min(productTotalPages, prev + 1))}
                />
              ) : null}
                </Card>
              </section>
            ) : null}

            {activeTab === 'orders' ? (
              <section>
                <Card title="Orders">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <FieldLabel htmlFor="orderStatusFilter" label="Filter By Status" />
                  <select
                    id="orderStatusFilter"
                    value={orderStatusFilter}
                    onChange={(event) => {
                      setOrderStatusFilter(event.target.value);
                      setOrderPage(1);
                    }}
                    className="mt-1 rounded-md border border-brand-line px-3 py-2 text-sm"
                  >
                    <option value="">All statuses</option>
                    {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => router.push('/dashboard/orders/new')}
                  className="rounded-md border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink"
                >
                  Create Order
                </button>
              </div>

              <div className="mb-2 grid grid-cols-[64px_minmax(0,1fr)_170px_120px] items-center rounded-md border border-brand-line bg-brand-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="text-center">No</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Total</span>
              </div>

              <ul className="space-y-2 text-sm">
                {orders.map((order, index) => (
                  <li key={order.id} className="rounded-md border border-brand-line p-3">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)_170px_120px] items-center gap-3">
                      <div className="flex justify-center">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-brand-soft px-2 text-xs font-semibold text-brand-ink">
                          {(orderPage - 1) * PAGE_SIZE + index + 1}
                        </span>
                      </div>
                      <p className="min-w-0 truncate font-medium text-brand-ink">{order.customerName}</p>
                      <select
                        value={order.status}
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          if (nextStatus !== order.status) {
                            void handleStatusUpdate(order.id, nextStatus);
                          }
                        }}
                        className="w-32 rounded-md border border-brand-line px-2 py-2 text-xs capitalize"
                      >
                        {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <span className="text-brand-muted">${order.totalPrice}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {orders.length ? (
                <PaginationControls
                  page={orderPage}
                  totalPages={orderTotalPages}
                  onPrevious={() => setOrderPage((prev) => Math.max(1, prev - 1))}
                  onNext={() => setOrderPage((prev) => Math.min(orderTotalPages, prev + 1))}
                />
              ) : null}
                </Card>
              </section>
            ) : null}

            {activeTab === 'restock' ? (
              <section>
                <Card title="Restock Queue">
              <p className="mb-2 text-sm text-brand-muted">
                Low Stock Items: {summary?.lowStockItemsCount ?? 0}
              </p>
              <ul className="space-y-2 text-sm">
                {restockQueue.map((item) => (
                  <li key={item.id} className="rounded-md border border-brand-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-brand-ink">{item.name}</span>
                      <span className="text-xs uppercase text-brand-muted">{item.priority}</span>
                    </div>
                    <p className="mt-1 text-brand-muted">
                      Stock {item.stock} / Threshold {item.minThreshold}
                    </p>
                    <button
                      onClick={() => handleRestock(item.id)}
                      className="mt-2 rounded-md border border-brand-line px-3 py-1 text-xs"
                    >
                      Restock
                    </button>
                  </li>
                ))}
                {!restockQueue.length ? <li className="text-brand-muted">No low stock products.</li> : null}
              </ul>
                </Card>
              </section>
            ) : null}

            {activeTab === 'activity' ? (
              <section>
                <Card title="Recent Activity">
              <ul className="space-y-2 text-sm text-brand-muted">
                {activity.map((entry) => (
                  <li key={entry.id} className="rounded-md border border-brand-line px-3 py-2">
                    <p className="font-medium text-brand-ink">{entry.action}</p>
                    <p>
                      {new Date(entry.createdAt).toLocaleTimeString()} - {entry.entityType ?? 'system'}
                    </p>
                  </li>
                ))}
              </ul>
                </Card>
              </section>
            ) : null}
          </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-5">
      <h2 className="mb-4 font-heading text-xl text-brand-ink">{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{title}</p>
      <p className="mt-2 font-heading text-3xl text-brand-ink">{value}</p>
    </div>
  );
}

function FieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
      {label}
    </label>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <button
        onClick={onPrevious}
        disabled={page <= 1}
        aria-label="Previous page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-brand-line bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={16} />
      </button>

      <p className="min-w-[80px] text-center text-brand-muted">
        Page {page} of {totalPages}
      </p>

      <button
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-brand-line bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
