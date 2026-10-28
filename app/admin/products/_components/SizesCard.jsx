'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import ProductPicker from '../../coupons/_components/ProductPicker';
import { Card, subdued } from '../../_components/EditorFields';

/**
 * Sizes of the same product are separate products, each with its own price and
 * stock. Linking them here shows them as size options on each other's page
 * (lib/sizeGroups.js). Saved on its own, separately from the product form.
 */
export default function SizesCard({ productId, size }) {
  const { adminProducts = [] } = useAppContext();
  const [ids, setIds] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/products/${productId}/sizes`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { sizes: [] }))
      .then(({ sizes = [] }) => {
        if (!alive) return;
        const list = sizes.map((p) => Number(p.id));
        setIds(list);
        setSaved(list);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [productId]);

  const dirty = ids.length !== saved.length || ids.some((id) => !saved.includes(id));
  const others = adminProducts.filter((p) => Number(p.id) !== Number(productId));
  const missingSize = !size?.trim();

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/sizes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save sizes');
      const list = (data.sizes || []).map((p) => Number(p.id));
      setIds(list);
      setSaved(list);
      toast.success(list.length ? 'Sizes linked' : 'Sizes unlinked');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Sizes"
      description="Other sizes of this product, each listed as its own product. They show as size choices on each other's page, with their own price and stock."
      action={dirty && (
        <button type="button" onClick={save} disabled={saving} className="sp-btn sp-btn-primary">
          {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : 'Save sizes'}
        </button>
      )}
    >
      {loading ? (
        <p className="text-[13px]" style={subdued}>Loading…</p>
      ) : (
        <>
          <ProductPicker products={others} value={ids} onChange={setIds} />
          {missingSize && ids.length > 0 && (
            <p className="text-[12px] mt-2" style={{ color: '#8a6100' }}>
              Fill in &ldquo;Size / volume&rdquo; above (and on each linked product) so the size choices have labels.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
