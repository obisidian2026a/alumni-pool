'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { inventoryApi } from '@/lib/api/inventory';
import type { AuthUser } from '@/types/auth';

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  useEffect(() => {
    inventoryApi
      .getCategories()
      .then((data) => {
        const category = data.find((item) => item.id === categoryId);
        if (!category) {
          setError('Category not found');
          return;
        }
        setName(category.name);
        setDescription(category.description ?? '');
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Unable to load category';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await inventoryApi.updateCategory(categoryId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push('/dashboard/categories');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to update category';
      setError(message);
    }
  }

  async function onDelete() {
    if (!isAdmin) {
      setError('Only admin can delete categories');
      return;
    }

    const confirmed = window.confirm('Delete this category?');
    if (!confirmed) {
      return;
    }

    try {
      await inventoryApi.deleteCategory(categoryId);
      router.push('/dashboard/categories');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to delete category';
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
      <h1 className="text-2xl font-semibold text-brand-ink">Edit Category</h1>
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="w-full border border-brand-line px-3 py-2 text-sm" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full border border-brand-line px-3 py-2 text-sm" rows={4} />
        <div className="flex gap-2">
          <button type="submit" className="bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Save</button>
          <button type="button" onClick={() => router.push('/dashboard/categories')} className="border border-brand-line px-4 py-2 text-sm">Cancel</button>
          <button type="button" onClick={onDelete} disabled={!isAdmin} className="border border-red-300 px-4 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
        </div>
      </form>
    </section>
  );
}
