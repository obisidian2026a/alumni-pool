'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { inventoryApi } from '@/lib/api/inventory';
import type { Category } from '@/types/inventory';

export default function ProductCreatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    inventoryApi
      .getCategories()
      .then((data) => {
        setCategories(data);
        if (data.length) {
          setForm((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Unable to load categories';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const created = await inventoryApi.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        brand: form.brand.trim() || undefined,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        price: Number(form.price),
        stock: Number(form.stock),
        minThreshold: Number(form.minThreshold),
      });
      router.push(`/dashboard/products/${created.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create product';
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

  return (
    <section className="space-y-4 border border-brand-line bg-white p-5">
      <h1 className="text-2xl font-semibold text-brand-ink">Add Product</h1>
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm md:col-span-2" placeholder="Name" required />
        <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="SKU" />
        <input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Brand" />
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Description" />
        <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Price" required />
        <input type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Stock" required />
        <input type="number" min="0" value={form.minThreshold} onChange={(e) => setForm((p) => ({ ...p, minThreshold: e.target.value }))} className="border border-brand-line px-3 py-2 text-sm" placeholder="Min threshold" required />
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Create</button>
          <button type="button" onClick={() => router.push('/dashboard/products')} className="border border-brand-line px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </section>
  );
}
