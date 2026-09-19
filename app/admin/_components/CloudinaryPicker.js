'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Search, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

/**
 * Modal grid of images already uploaded to the store's Cloudinary account, so an
 * admin can reuse one instead of re-uploading the same file. Paging is
 * Cloudinary's own cursor; the search box filters what has been loaded so far
 * (press "Load more" to pull the next page in).
 */
export default function CloudinaryPicker({ open, onClose, onSelect, title = 'Choose from Cloudinary' }) {
  const { fetchWithAuth } = useAppContext();

  const [images, setImages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const loadPage = useCallback(async (nextCursor) => {
    setLoading(true);
    setError('');
    try {
      const url = nextCursor
        ? `/api/admin/cloudinary-images?cursor=${encodeURIComponent(nextCursor)}`
        : '/api/admin/cloudinary-images';
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setImages((prev) => (nextCursor ? [...prev, ...(data.images || [])] : data.images || []));
      setCursor(data.nextCursor || null);
    } catch (err) {
      console.error('Error loading Cloudinary library:', err);
      setError('Could not load your Cloudinary library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  // Fetch the first page each time the picker is opened, and reset on close.
  useEffect(() => {
    if (!open) {
      setImages([]);
      setCursor(null);
      setSelected(null);
      setQuery('');
      return;
    }
    loadPage();
  }, [open, loadPage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const visible = q ? images.filter((img) => img.publicId.toLowerCase().includes(q)) : images;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[86vh] bg-white rounded-2xl overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100 bg-purple-50/40 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-purple-700">{title}</p>
            <p className="text-xs text-purple-400 mt-0.5">Pick any image you have already uploaded.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-purple-400 hover:text-purple-700 hover:bg-purple-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter loaded images by name…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-purple-300"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {images.length === 0 && loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-purple-500" />
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              {images.length === 0 ? 'No images found in Cloudinary yet.' : 'Nothing matches that filter.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map((img) => {
                const isSelected = selected?.publicId === img.publicId;
                return (
                  <button
                    key={img.publicId}
                    type="button"
                    onClick={() => setSelected(img)}
                    onDoubleClick={() => onSelect(img)}
                    className={`group text-left rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100 hover:border-purple-200'
                    }`}
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <Image
                        src={img.url}
                        alt={img.publicId}
                        fill
                        sizes="(max-width: 768px) 45vw, 200px"
                        className="object-cover"
                      />
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] font-medium text-gray-700 truncate">{img.publicId}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{img.width}×{img.height} · {img.format}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {cursor && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => loadPage(cursor)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-60"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 truncate">
            {selected ? selected.publicId : 'Select an image to continue.'}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => onSelect(selected)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}
            >
              Use this image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
