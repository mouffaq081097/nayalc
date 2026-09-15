'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import ProductEditor from '../_components/ProductEditor';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Product not found');
      setProduct({ ...data, loadedAt: Date.now() });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <XCircle size={40} style={{ color: 'var(--sp-text-subdued)' }} />
        <p className="text-[14px] font-medium" style={{ color: 'var(--sp-text)' }}>This product couldn&apos;t be loaded: {error}</p>
        <Link href="/admin/products" className="sp-btn sp-btn-secondary">Back to products</Link>
      </div>
    );
  }
  if (!product) return <PageLoader />;

  // Remount after each save so the editor starts from the freshly saved product (new image URLs included)
  return <ProductEditor key={product.loadedAt} product={product} onSaved={load} />;
}
