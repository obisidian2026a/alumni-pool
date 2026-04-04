'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { ApiError } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';
import type { Category, Product } from '@/types/inventory';

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return false;
    }

    try {
      const user = JSON.parse(raw) as Partial<AuthUser>;
      return user.role === 'admin';
    } catch {
      return false;
    }
  }, []);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    brand: '',
    description: '',
    categoryId: '',
    price: '0',
    stock: '0',
    minThreshold: '5',
  });

  useEffect(() => {
    Promise.all([inventoryApi.getProductById(productId), inventoryApi.getCategories()])
      .then(([productData, categoryData]) => {
        setProduct(productData);
        setCategories(categoryData);
        setForm({
          name: productData.name,
          sku: productData.sku ?? '',
          brand: productData.brand ?? '',
          description: productData.description ?? '',
          categoryId: productData.categoryId,
          price: String(productData.price),
          stock: String(productData.stock),
          minThreshold: String(productData.minThreshold),
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Unable to load product edit page';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await inventoryApi.updateProduct(productId, {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        brand: form.brand.trim() || undefined,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        price: Number(form.price),
        stock: Number(form.stock),
        minThreshold: Number(form.minThreshold),
      });
      router.push(`/dashboard/products/${productId}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to update product';
      setError(message);
    }
  }

  async function onDelete() {
    if (!isAdmin) {
      setError('Only admin can delete products');
      return;
    }

    const confirmed = window.confirm('Delete this product?');
    if (!confirmed) return;

    try {
      await inventoryApi.deleteProduct(productId);
      router.push('/dashboard/products');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to delete product';
      setError(message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-line border-t-brand-primary" />
      </div>
    );
  }

  if (!product) {
    return <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? 'Product not found'}</p>;
  }

  return (
    <section className="space-y-4 border border-brand-line bg-white p-5">
      <h1 className="text-2xl font-semibold text-brand-ink">Edit Product</h1>
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm md:col-span-2" placeholder="Name" />
        <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="SKU" />
        <input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Brand" />
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Description" />
        <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Price" />
        <input type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Stock" />
        <input type="number" min="0" value={form.minThreshold} onChange={(e) => setForm((p) => ({ ...p, minThreshold: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Min threshold" />
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Save</button>
          <button type="button" onClick={() => router.push(`/dashboard/products/${productId}`)} className="border border-brand-line px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={onDelete} disabled={!isAdmin} className="border border-red-300 px-4 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
        </div>
      </form>
    </section>
  );
}
