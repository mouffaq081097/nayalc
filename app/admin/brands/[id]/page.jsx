'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import BrandEditor from '../_components/BrandEditor';

export default function EditBrandPage() {
  const { id } = useParams();
  const [brand, setBrand] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Brand not found');
      setBrand({ ...data, loadedAt: Date.now() });
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
        <p className="text-[14px] font-medium" style={{ color: 'var(--sp-text)' }}>This brand couldn&apos;t be loaded: {error}</p>
        <Link href="/admin/brands" className="sp-btn sp-btn-secondary">Back to brands</Link>
      </div>
    );
  }
  if (!brand) return <PageLoader />;

  // Remount after each save so the editor starts from the freshly saved brand
  return <BrandEditor key={brand.loadedAt} brand={brand} onSaved={load} />;
}
