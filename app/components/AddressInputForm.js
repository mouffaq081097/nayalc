'use client';

import React, { useState } from 'react';
import PhoneNumberInput from './PhoneNumberInput';
import { toast } from 'react-toastify';
import { Tag, MapPin, Building2, Navigation, ChevronDown } from 'lucide-react';

const UAE_EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];

const lbl = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(59,7,100,0.55)',
  marginBottom: '6px',
};

const opt = { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(59,7,100,0.35)', fontSize: '10px' };

const fieldStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(216,180,254,0.45)',
  background: 'rgba(248,240,255,0.6)',
  color: '#3b0764',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  appearance: 'none',
  WebkitAppearance: 'none',
};

const focus = {
  onFocus: e => { e.target.style.borderColor = 'rgb(196,167,254)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,167,254,0.18)'; },
  onBlur:  e => { e.target.style.borderColor = 'rgba(216,180,254,0.45)'; e.target.style.boxShadow = 'none'; },
};

export default function AddressInputForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({
    addressLabel:  initialData?.addressLabel  || '',
    customerPhone: initialData?.customerPhone || initialData?.customer_phone || '',
    addressLine1:  initialData?.addressLine1  || initialData?.address_line1  || '',
    apartment:     initialData?.apartment     || '',
    city:          initialData?.city          || '',       // emirate
    state:         initialData?.state         || '',       // area / community
    country:       'United Arab Emirates',
    latitude:      null,
    longitude:     null,
    isDefault:     initialData?.isDefault     || false,
    zipCode:       initialData?.zipCode       || initialData?.zip_code || '0000',
    landmark:      '',
  });

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.city)               { toast.error('Please select an emirate.');             return; }
    if (!form.state.trim())       { toast.error('Area / community is required.');         return; }
    if (!form.addressLine1.trim()){ toast.error('Building / villa / street is required.'); return; }
    if (!form.customerPhone)      { toast.error('Phone number is required.');             return; }

    const { landmark, ...rest } = form;
    const addressLine1 = landmark.trim()
      ? `${rest.addressLine1} (Near ${landmark.trim()})`
      : rest.addressLine1;

    onSave({ ...rest, addressLine1 });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-5">

        {/* ── Row 1: Emirate + Area ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label style={lbl}>
              Emirate <span style={{ color: 'rgb(196,167,254)' }}>*</span>
            </label>
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <select
                name="city"
                value={form.city}
                onChange={set}
                style={{ ...fieldStyle, paddingLeft: '34px', paddingRight: '32px', cursor: 'pointer' }}
                {...focus}
              >
                <option value="">Select emirate…</option>
                {UAE_EMIRATES.map(em => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>
              Area / Community <span style={{ color: 'rgb(196,167,254)' }}>*</span>
            </label>
            <input
              name="state"
              value={form.state}
              onChange={set}
              placeholder="e.g. Jumeirah, JBR, Mirdif, Al Nahyan"
              style={fieldStyle}
              {...focus}
            />
          </div>
        </div>

        {/* ── Row 2: Building / Villa / Street (full width) ── */}
        <div>
          <label style={lbl}>
            Building / Villa / Street <span style={{ color: 'rgb(196,167,254)' }}>*</span>
          </label>
          <div className="relative">
            <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={set}
              placeholder="e.g. Al Fattan Tower, Villa 23, Shk Zayed Rd"
              style={{ ...fieldStyle, paddingLeft: '34px' }}
              {...focus}
            />
          </div>
        </div>

        {/* ── Row 3: Floor / Apt + Nearest Landmark ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label style={lbl}>
              Floor / Apartment <span style={opt}>optional</span>
            </label>
            <input
              name="apartment"
              value={form.apartment}
              onChange={set}
              placeholder="e.g. Floor 5, Apt 501, Unit B"
              style={fieldStyle}
              {...focus}
            />
          </div>

          <div>
            <label style={lbl}>
              Nearest Landmark <span style={opt}>optional</span>
            </label>
            <div className="relative">
              <Navigation size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <input
                name="landmark"
                value={form.landmark}
                onChange={set}
                placeholder="e.g. Near Mall of Emirates"
                style={{ ...fieldStyle, paddingLeft: '34px' }}
                {...focus}
              />
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid rgba(216,180,254,0.25)', margin: '4px 0' }} />

        {/* ── Phone ── */}
        <div>
          <label style={lbl}>
            Phone Number <span style={{ color: 'rgb(196,167,254)' }}>*</span>
          </label>
          <PhoneNumberInput value={form.customerPhone} onChange={set} />
        </div>

        {/* ── Label + Default ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">

          <div>
            <label style={lbl}>
              Address Label <span style={opt}>optional</span>
            </label>
            <div className="relative">
              <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <input
                name="addressLabel"
                value={form.addressLabel}
                onChange={set}
                placeholder="e.g. Home, Office, Villa…"
                style={{ ...fieldStyle, paddingLeft: '34px' }}
                {...focus}
              />
            </div>
          </div>

          <label
            className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3"
            style={{ background: 'rgba(196,167,254,0.12)', border: '1px solid rgba(216,180,254,0.3)' }}
          >
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={set}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'rgb(126,105,230)' }}
            />
            <span className="text-[12px] font-semibold" style={{ color: '#3b0764' }}>Set as primary address</span>
          </label>
        </div>

        {/* ── Buttons ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.98]"
            style={{
              border: '1px solid rgba(216,180,254,0.45)',
              color: 'rgb(126,105,230)',
              background: 'rgba(248,240,255,0.6)',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
              boxShadow: '0 4px 16px rgba(147,51,234,0.2)',
            }}
          >
            Save Address
          </button>
        </div>

      </div>
    </form>
  );
}
