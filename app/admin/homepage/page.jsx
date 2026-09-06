'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Loader2, RotateCcw, UploadCloud } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '@/app/components/PageLoader';

/** Shared upload/reset card shell — a preview, a "Custom"/"Default" badge, and
 * Replace/Reset buttons. Callers supply the actual network calls. */
function ImageSlotCard({ label, subtitle, imageUrl, alt, isCustom, onUpload, onReset }) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
      setPreview(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Revert "${label}" to the default image?`)) return;
    setBusy(true);
    setError('');
    try {
      await onReset();
    } catch (err) {
      console.error('Error reverting image:', err);
      setError('Could not revert. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const displayUrl = preview || imageUrl;

  return (
    <div className="border border-purple-100 rounded-xl overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-purple-700 truncate">{label}</p>
          {subtitle && <p className="text-xs text-purple-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${isCustom ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          {isCustom ? 'Custom' : 'Default'}
        </span>
      </div>

      <div className="p-6 space-y-4">
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
          {displayUrl ? (
            <Image src={displayUrl} alt={alt || label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 480px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon size={32} />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-purple-500" />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
          >
            <UploadCloud size={14} />
            Replace image
          </button>
          {isCustom && (
            <button
              type="button"
              disabled={busy}
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-60"
            >
              <RotateCcw size={14} />
              Reset to default
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
}

function HomepageSlotsSection() {
  const { fetchWithAuth } = useAppContext();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth('/api/admin/homepage-images');
        setSlots(await res.json());
      } catch (err) {
        console.error('Error loading homepage image slots:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchWithAuth]);

  const updateSlot = (key, patch) => setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  if (loading) return <PageLoader />;
  if (slots.length === 0) return <p className="text-sm text-gray-400">No editable homepage images yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {slots.map((slot) => (
        <ImageSlotCard
          key={slot.key}
          label={slot.label}
          subtitle={slot.section && `Shown in the "${slot.section}" section`}
          imageUrl={slot.imageUrl}
          alt={slot.alt}
          isCustom={slot.isCustom}
          onUpload={async (file) => {
            const form = new FormData();
            form.append('key', slot.key);
            form.append('image', file);
            const res = await fetchWithAuth('/api/admin/homepage-images', { method: 'POST', body: form });
            const data = await res.json();
            updateSlot(slot.key, { imageUrl: data.slot.image_url, alt: data.slot.alt_text, isCustom: true, updatedAt: data.slot.updated_at });
          }}
          onReset={async () => {
            await fetchWithAuth(`/api/admin/homepage-images?key=${encodeURIComponent(slot.key)}`, { method: 'DELETE' });
            updateSlot(slot.key, { imageUrl: slot.fallbackUrl, isCustom: false, updatedAt: null });
          }}
        />
      ))}
    </div>
  );
}

/** Real, in-stock fragrance products — the same pool the homepage's "Signature
 * selection" spotlight rotates through (see pickSignature() in
 * NayaLumiereHome.js). Each can have its own spotlight photo, independent of
 * its regular catalog photo used everywhere else. */
function SignatureSelectionSection() {
  const { adminProducts, fetchWithAuth, loading: productsLoading } = useAppContext();

  const [overrides, setOverrides] = useState({}); // productId -> signatureImageUrl | null

  const fragranceProducts = adminProducts.filter((p) =>
    (p.categoryNames || '').split(',').map((s) => s.trim()).includes('Fragrence')
  );

  const effectiveUrl = (p) => (p.id in overrides ? overrides[p.id] : p.signatureImageUrl) || p.imageUrl;
  const isCustom = (p) => !!((p.id in overrides ? overrides[p.id] : p.signatureImageUrl));

  if (productsLoading) return <PageLoader />;
  if (fragranceProducts.length === 0) {
    return <p className="text-sm text-gray-400">No fragrance products yet — add one under Products to feature it here.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {fragranceProducts.map((p) => (
        <ImageSlotCard
          key={p.id}
          label={p.name}
          subtitle="Signature selection spotlight"
          imageUrl={effectiveUrl(p)}
          alt={p.name}
          isCustom={isCustom(p)}
          onUpload={async (file) => {
            const form = new FormData();
            form.append('image', file);
            const res = await fetchWithAuth(`/api/admin/products/${p.id}/signature-image`, { method: 'POST', body: form });
            const data = await res.json();
            setOverrides((prev) => ({ ...prev, [p.id]: data.signatureImageUrl }));
          }}
          onReset={async () => {
            await fetchWithAuth(`/api/admin/products/${p.id}/signature-image`, { method: 'DELETE' });
            setOverrides((prev) => ({ ...prev, [p.id]: null }));
          }}
        />
      ))}
    </div>
  );
}

/** Every brand — active or not, so an admin can prep a photo before switching
 * one on. Falls back, same as the homepage does, to that brand's best-rated
 * product photo when no dedicated brand photo has been uploaded. */
function ProvenanceSection() {
  const { adminBrands, adminProducts, fetchWithAuth, loading: dataLoading } = useAppContext();
  const [overrides, setOverrides] = useState({}); // brandId -> imageUrl | null

  const currentImage = (b) => (b.id in overrides ? overrides[b.id] : b.imageurl);
  const isCustom = (b) => !!currentImage(b);
  const effectiveUrl = (b) => {
    if (currentImage(b)) return currentImage(b);
    const brandProducts = adminProducts.filter((p) => Number(p.brand_id) === Number(b.id));
    const best = [...brandProducts].sort((a, b2) => Number(b2.averageRating || 0) - Number(a.averageRating || 0))[0];
    return best?.imageUrl || null;
  };

  if (dataLoading) return <PageLoader />;
  if (adminBrands.length === 0) {
    return <p className="text-sm text-gray-400">No brands yet — add one under Brands to feature it here.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {adminBrands.map((b) => (
        <ImageSlotCard
          key={b.id}
          label={b.name}
          subtitle="Provenance — Our three houses"
          imageUrl={effectiveUrl(b)}
          alt={b.name}
          isCustom={isCustom(b)}
          onUpload={async (file) => {
            const form = new FormData();
            form.append('image', file);
            const res = await fetchWithAuth(`/api/admin/brands/${b.id}/image`, { method: 'POST', body: form });
            const data = await res.json();
            setOverrides((prev) => ({ ...prev, [b.id]: data.imageUrl }));
          }}
          onReset={async () => {
            await fetchWithAuth(`/api/admin/brands/${b.id}/image`, { method: 'DELETE' });
            setOverrides((prev) => ({ ...prev, [b.id]: null }));
          }}
        />
      ))}
    </div>
  );
}

export default function AdminHomepageImages() {
  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Homepage images</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Editorial photos on the homepage that aren't already tied to a category. Everything else on the homepage — the
          hero banner and the Instagram feed — is managed from their own pages: Hero banner and Social.
        </p>
      </div>

      <HomepageSlotsSection />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Provenance — Our three houses</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            The photo shown for each brand on the homepage. Leave a brand without one and it falls back to that brand's
            best-rated product photo.
          </p>
        </div>
        <ProvenanceSection />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Signature selection</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Give any fragrance its own spotlight photo for the homepage — used only there, instead of its regular product
            photo, so the rest of the site (search, collections, cart) is unaffected.
          </p>
        </div>
        <SignatureSelectionSection />
      </div>
    </div>
  );
}
