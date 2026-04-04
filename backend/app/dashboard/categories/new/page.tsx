'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { inventoryApi } from '@/lib/api/inventory';

export default function CategoryCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await inventoryApi.createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push('/dashboard/categories');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create category';
      setError(message);
    }
  }

  return (
    <section className="space-y-4 border border-brand-line bg-white p-5">
      <h1 className="text-2xl font-semibold text-brand-ink">Add Category</h1>
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="w-full border border-brand-line px-3 py-2 text-sm" required />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full border border-brand-line px-3 py-2 text-sm" rows={4} />
        <div className="flex gap-2">
          <button type="submit" className="bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Create</button>
          <button type="button" onClick={() => router.push('/dashboard/categories')} className="border border-brand-line px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </section>
  );
}
