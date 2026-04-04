'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, ShoppingCart, Trash2 } from 'lucide-react';
import { inventoryApi } from '@/lib/api/inventory';
import { ApiError } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';
import type { Product } from '@/types/inventory';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      .getProductById(productId)
      .then((data) => setProduct(data))
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Unable to load product';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleDelete() {
    if (!product || !isAdmin) return;
    const confirmed = window.confirm(`Delete product "${product.name}"?`);
    if (!confirmed) return;

    try {
      await inventoryApi.deleteProduct(product.id);
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
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-line pb-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-ink">{product.name}</h1>
          <p className="text-sm text-brand-muted">{product.categoryName ?? 'Uncategorized'}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/products/${product.id}/edit`} className="inline-flex items-center gap-2 border border-brand-line px-3 py-2 text-sm text-brand-ink">
            <Edit size={16} /> Edit
          </Link>
          <button
            disabled={!isAdmin}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow label="SKU" value={product.sku || 'N/A'} />
        <InfoRow label="Brand" value={product.brand || 'N/A'} />
        <InfoRow label="Price" value={`$${product.price}`} />
        <InfoRow label="Stock" value={String(product.stock)} />
        <InfoRow label="Min Threshold" value={String(product.minThreshold)} />
        <InfoRow label="Status" value={product.status} />
      </div>

      {product.description ? (
        <div className="border border-brand-line p-3 text-sm text-brand-muted">{product.description}</div>
      ) : null}

      <div className="flex gap-2">
        <button
          onClick={() => router.push('/dashboard/products')}
          className="border border-brand-line px-3 py-2 text-sm text-brand-ink"
        >
          Back to Products
        </button>
        <button
          onClick={() => router.push(`/dashboard/orders/new?productId=${product.id}`)}
          className="inline-flex items-center gap-2 bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
        >
          <ShoppingCart size={16} /> Order This
        </button>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-line p-3">
      <p className="text-xs uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-ink">{value}</p>
    </div>
  );
}
