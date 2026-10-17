'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Images, Loader2, RotateCcw, UploadCloud } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import CloudinaryPicker from '../_components/CloudinaryPicker';
import PageLoader from '@/app/components/PageLoader';
import CampaignsSection from './CampaignsSection';

/** Shared upload/reset card shell — a preview, a "Custom"/"Default" badge, and
 * Replace/Reset buttons. Callers supply the actual network calls. Pass
 * `onPickExisting` to also offer the Cloudinary library as a source. */
function ImageSlotCard({ label, subtitle, imageUrl, alt, isCustom, onUpload, onReset, onPickExisting, media = 'image' }) {
  const isVideo = media === 'video';
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

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
      setError(err?.message && isVideo ? err.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      setPreview(null);
    }
  };

  const handlePick = async (image) => {
    if (!image) return;
    setPickerOpen(false);
    setError('');
    setBusy(true);
    try {
      await onPickExisting(image);
    } catch (err) {
      console.error('Error applying Cloudinary image:', err);
      setError('Could not apply that image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(isVideo ? `Remove the video from "${label}"?` : `Revert "${label}" to the default image?`)) return;
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
          {displayUrl && isVideo ? (
            <video src={displayUrl} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay controls />
          ) : displayUrl ? (
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
            {isVideo ? (displayUrl ? 'Replace video' : 'Upload video') : 'Replace image'}
          </button>
          {onPickExisting && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-60"
            >
              <Images size={14} />
              Choose from library
            </button>
          )}
          {isCustom && (
            <button
              type="button"
              disabled={busy}
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-60"
            >
              <RotateCcw size={14} />
              {isVideo ? 'Remove video' : 'Reset to default'}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept={isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/*'} className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {onPickExisting && (
        <CloudinaryPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handlePick}
          title={`Choose a photo for "${label}"`}
        />
      )}
    </div>
  );
}

/** `media` picks which slots to list: the photo slots or the story videos. */
function HomepageSlotsSection({ media = 'image' }) {
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

  const shown = slots.filter((s) => (s.media || 'image') === media);

  if (loading) return <PageLoader />;
  if (shown.length === 0) return <p className="text-sm text-gray-400">No editable homepage {media === 'video' ? 'videos' : 'images'} yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {shown.map((slot) => (
        <ImageSlotCard
          key={slot.key}
          label={slot.label}
          subtitle={slot.section && `Shown in the "${slot.section}" section`}
          imageUrl={slot.imageUrl}
          alt={slot.alt}
          isCustom={slot.isCustom}
          media={slot.media}
          onUpload={async (file) => {
            if (slot.media === 'video') {
              // Straight from the browser to Cloudinary (Vercel caps our own uploads at 4.5 MB)
              if (file.size > 100 * 1024 * 1024) throw new Error('Videos must be under 100 MB.');
              const signRes = await fetchWithAuth('/api/admin/cloudinary-sign', { method: 'POST' });
              if (!signRes.ok) throw new Error('Could not start the upload.');
              const sign = await signRes.json();
              const up = new FormData();
              up.append('file', file);
              up.append('api_key', sign.apiKey);
              up.append('timestamp', sign.timestamp);
              up.append('signature', sign.signature);
              up.append('folder', sign.folder);
              const cloud = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`, { method: 'POST', body: up });
              if (!cloud.ok) throw new Error('Cloudinary rejected the video. Try an MP4 under 100 MB.');
              const { secure_url } = await cloud.json();
              const res = await fetchWithAuth('/api/admin/homepage-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: slot.key, image_url: secure_url }),
              });
              if (!res.ok) throw new Error('Uploaded, but could not save it. Please try again.');
              const data = await res.json();
              updateSlot(slot.key, { imageUrl: data.slot.image_url, alt: data.slot.alt_text, isCustom: true, updatedAt: data.slot.updated_at });
              return;
            }
            const form = new FormData();
            form.append('key', slot.key);
            form.append('image', file);
            const res = await fetchWithAuth('/api/admin/homepage-images', { method: 'POST', body: form });
            const data = await res.json();
            updateSlot(slot.key, { imageUrl: data.slot.image_url, alt: data.slot.alt_text, isCustom: true, updatedAt: data.slot.updated_at });
          }}
          onPickExisting={slot.media === 'video' ? undefined : async (image) => {
            const res = await fetchWithAuth('/api/admin/homepage-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: slot.key, image_url: image.url }),
            });
            if (!res.ok) throw new Error('Could not apply image');
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
    (p.categoryNames || '').split(',').some((s) => FRAGRANCE_CATEGORY.test(s.trim()))
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

// The category was once spelled "Fragrence"; match either spelling
const FRAGRANCE_CATEGORY = /^fragr[ae]nce$/i;

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

      <CampaignsSection />

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Story videos</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            The two videos in the black &quot;The Naya ritual&quot; band, just above the journal on the homepage. They play silently
            on a loop. Use MP4 (or MOV / WebM) under 100 MB, ideally 5–15 seconds and slightly taller than square (about 9 : 10).
            The band stays hidden until at least one video is uploaded; changes show on the site within about 5 minutes.
          </p>
        </div>
        <HomepageSlotsSection media="video" />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Banner photos</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">The GERnétic and perfume banners, desktop and phone versions.</p>
        </div>
        <HomepageSlotsSection />
      </div>

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
