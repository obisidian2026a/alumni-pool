'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { inventoryApi } from '@/lib/api/inventory';
import type { Product } from '@/types/inventory';

export default function OrderCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preferredProductId = searchParams.get('productId') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi
      .getProducts({ status: 'active', page: 1, limit: 100 })
      .then((data) => {
        setProducts(data.data);
        if (preferredProductId) {
          setProductId(preferredProductId);
        } else if (data.data.length) {
          setProductId(data.data[0].id);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : 'Unable to load products';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [preferredProductId]);

  const totalPreview = useMemo(() => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return '0.00';
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return '0.00';
    }

    return (Number(product.price) * qty).toFixed(2);
  }, [productId, products, quantity]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const qty = Number(quantity);
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!productId) {
      setError('Product is required');
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    try {
      await inventoryApi.createOrder({
        customerName: customerName.trim(),
        items: [{ productId, quantity: qty }],
      });
      router.push('/dashboard/orders');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create order';
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
      <h1 className="text-2xl font-semibold text-brand-ink">Create Order</h1>
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full border border-brand-line px-3 py-2 text-sm"
          placeholder="Customer name"
          required
        />
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full border border-brand-line px-3 py-2 text-sm"
          required
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name} ({product.stock} in stock)</option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border border-brand-line px-3 py-2 text-sm"
          placeholder="Quantity"
          required
        />

        <p className="text-sm text-brand-muted">Estimated total: ${totalPreview}</p>

        <div className="flex gap-2">
          <button type="submit" className="bg-brand-primary px-4 py-2 text-sm font-semibold text-white">Place Order</button>
          <button type="button" onClick={() => router.push('/dashboard/orders')} className="border border-brand-line px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </section>
  );
}
