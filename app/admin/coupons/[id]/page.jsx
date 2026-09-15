'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import CouponEditor from '../_components/CouponEditor';

export default function EditDiscountPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [couponRes, ordersRes] = await Promise.all([
        fetch(`/api/coupons/${id}`, { cache: 'no-store' }),
        fetch(`/api/coupons/${id}/orders`, { cache: 'no-store' }),
      ]);
      const coupon = await couponRes.json();
      if (!couponRes.ok) throw new Error(coupon.message || 'Discount not found');
      const orders = ordersRes.ok ? await ordersRes.json() : [];
      setData({ coupon, orders, loadedAt: Date.now() });
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
        <p className="text-[14px] font-medium" style={{ color: 'var(--sp-text)' }}>This discount couldn&apos;t be loaded: {error}</p>
        <Link href="/admin/coupons" className="sp-btn sp-btn-secondary">Back to discounts</Link>
      </div>
    );
  }
  if (!data) return <PageLoader />;

  // Remount after each save so the editor starts from the freshly saved discount
  return <CouponEditor key={data.loadedAt} coupon={data.coupon} orders={data.orders} onSaved={load} />;
}
