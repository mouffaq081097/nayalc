'use client';
import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { ImagePlus, Package, RefreshCw, Trash2 } from 'lucide-react';
import { secondary, subdued, text } from './EditorFields';

// Small square product/brand thumbnail with a placeholder icon
export const Thumb = ({ url, size }) => (
  <span className="rounded-md bg-white shrink-0 overflow-hidden flex items-center justify-center" style={{ width: size, height: size, border: '1px solid var(--sp-border)' }}>
    {url ? <img src={url} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={Math.round(size / 2.5)} style={subdued} />}
  </span>
);

// A single image picker with drag and drop, Replace and Remove.
// value is { url } for a saved image, { file, preview } for a new one, or null.
export const ImageSlot = ({ label, hint, aspectClass, value, onChange, fit = 'cover' }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (fileList) => {
    const files = Array.from(fileList || []);
    const file = files.find(f => f.type.startsWith('image/'));
    if (!file) {
      if (files.length) toast.error('Choose an image file.');
      return;
    }
    if (value?.preview) URL.revokeObjectURL(value.preview);
    onChange({ file, preview: URL.createObjectURL(file) });
  };
  const remove = () => {
    if (value?.preview) URL.revokeObjectURL(value.preview);
    onChange(null);
  };

  return (
    <div>
      <p className="text-[13px] font-medium mb-1.5" style={secondary}>{label}</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { pick(e.target.files); e.target.value = ''; }} />
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
        className={`relative ${aspectClass} rounded-lg overflow-hidden`}
        style={dragging ? { outline: '2px dashed var(--sp-focus)', outlineOffset: 2 } : undefined}
      >
        {value ? (
          <>
            <img
              src={value.preview || value.url}
              alt=""
              className={`w-full h-full ${fit === 'contain' ? 'object-contain p-3' : 'object-cover'}`}
              style={{ background: fit === 'contain' ? '#ffffff' : 'var(--sp-surface-sub)', boxShadow: 'inset 0 0 0 1px var(--sp-border)' }}
            />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button type="button" onClick={() => inputRef.current?.click()} className="sp-btn sp-btn-secondary" style={{ padding: '6px 10px' }}>
                <RefreshCw size={13} />Replace
              </button>
              <button type="button" onClick={remove} aria-label={`Remove ${label.toLowerCase()}`} title="Remove" className="sp-btn sp-btn-secondary text-red-600" style={{ padding: '6px 8px' }}>
                <Trash2 size={13} />
              </button>
            </div>
            {value.file && <span className="absolute left-2 bottom-2 sp-badge sp-badge-info">New</span>}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5 px-4 text-center hover:bg-[#fafafa] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--sp-border-strong)' }}
          >
            <ImagePlus size={20} style={secondary} />
            <span className="text-[13px] font-semibold" style={text}>Add image</span>
            <span className="text-[12px]" style={subdued}>or drop a file here</span>
          </button>
        )}
      </div>
      {hint && <p className="text-[12px] mt-1.5" style={subdued}>{hint}</p>}
    </div>
  );
};
