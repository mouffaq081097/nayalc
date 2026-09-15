'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import CategoryEditor from '../_components/CategoryEditor';

export default function EditCategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      // admin=true includes hidden products, so saving never drops them from the category
      const res = await fetch(`/api/categories/${id}?admin=true`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Category not found');
      setCategory({ ...data, loadedAt: Date.now() });
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
        <p className="text-[14px] font-medium" style={{ color: 'var(--sp-text)' }}>This category couldn&apos;t be loaded: {error}</p>
        <Link href="/admin/categories" className="sp-btn sp-btn-secondary">Back to categories</Link>
      </div>
    );
  }
  if (!category) return <PageLoader />;

  // Remount after each save so the editor starts from the freshly saved category
  return <CategoryEditor key={category.loadedAt} category={category} onSaved={load} />;
}
