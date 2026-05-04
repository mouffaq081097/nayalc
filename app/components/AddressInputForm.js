'use client';

import React, { useState } from 'react';
import PhoneNumberInput from './PhoneNumberInput';
import { Tag, MapPin, Building2, Navigation, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const baseField = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  color: '#3b0764',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  appearance: 'none',
  WebkitAppearance: 'none',
};

const fieldStyle = (hasError) => ({
  ...baseField,
  border: hasError ? '1px solid rgba(252,165,165,0.9)' : '1px solid rgba(216,180,254,0.45)',
  background: hasError ? 'rgba(255,242,242,0.7)' : 'rgba(248,240,255,0.6)',
});

const focus = (hasError) => ({
  onFocus: e => {
    e.target.style.borderColor = hasError ? 'rgba(252,165,165,0.9)' : 'rgb(196,167,254)';
    e.target.style.boxShadow = hasError ? '0 0 0 3px rgba(252,165,165,0.15)' : '0 0 0 3px rgba(196,167,254,0.18)';
  },
  onBlur: e => {
    e.target.style.borderColor = hasError ? 'rgba(252,165,165,0.9)' : 'rgba(216,180,254,0.45)';
    e.target.style.boxShadow = 'none';
  },
});

function FieldError({ message }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-1.5 mt-1.5"
      style={{ color: 'rgb(220,38,38)', fontSize: '11px', fontWeight: 600 }}
    >
      <span className="w-1 h-1 rounded-full bg-red-500 inline-block shrink-0" />
      {message}
    </motion.p>
  );
}

export default function AddressInputForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({
    addressLabel:  initialData?.addressLabel  || '',
    customerPhone: initialData?.customerPhone || initialData?.customer_phone || '',
    addressLine1:  initialData?.addressLine1  || initialData?.address_line1  || '',
    apartment:     initialData?.apartment     || '',
    city:          initialData?.city          || '',
    state:         initialData?.state         || '',
    country:       'United Arab Emirates',
    latitude:      null,
    longitude:     null,
    isDefault:     initialData?.isDefault     || false,
    zipCode:       initialData?.zipCode       || initialData?.zip_code || '0000',
    landmark:      '',
  });

  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  const set = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
    if (saveError) setSaveError(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.city)                { errs.city          = 'Please select an emirate'; }
    if (!form.state.trim())        { errs.state         = 'Area / community is required'; }
    if (!form.addressLine1.trim()) { errs.addressLine1  = 'Building / villa / street is required'; }
    if (!form.customerPhone)       { errs.customerPhone = 'Phone number is required'; }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const { landmark, ...rest } = form;
    const addressLine1 = landmark.trim()
      ? `${rest.addressLine1} (Near ${landmark.trim()})`
      : rest.addressLine1;

    try {
      await onSave({ ...rest, addressLine1 });
      // Parent closes the modal on success — saving stays true until unmount
    } catch {
      setSaveError('Something went wrong. Please try again.');
      setSaving(false);
    }
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
              <MapPin size={13} className="absolute left-3 top-[13px] pointer-events-none" style={{ color: errors.city ? 'rgb(220,38,38)' : 'rgb(196,167,254)' }} />
              <ChevronDown size={13} className="absolute right-3 top-[13px] pointer-events-none" style={{ color: errors.city ? 'rgb(220,38,38)' : 'rgb(196,167,254)' }} />
              <select
                name="city"
                value={form.city}
                onChange={set}
                style={{ ...fieldStyle(!!errors.city), paddingLeft: '34px', paddingRight: '32px', cursor: 'pointer' }}
                {...focus(!!errors.city)}
              >
                <option value="">Select emirate…</option>
                {UAE_EMIRATES.map(em => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
            </div>
            <AnimatePresence><FieldError message={errors.city} /></AnimatePresence>
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
              style={fieldStyle(!!errors.state)}
              {...focus(!!errors.state)}
            />
            <AnimatePresence><FieldError message={errors.state} /></AnimatePresence>
          </div>
        </div>

        {/* ── Row 2: Building / Villa / Street ── */}
        <div>
          <label style={lbl}>
            Building / Villa / Street <span style={{ color: 'rgb(196,167,254)' }}>*</span>
          </label>
          <div className="relative">
            <Building2 size={13} className="absolute left-3 top-[13px] pointer-events-none" style={{ color: errors.addressLine1 ? 'rgb(220,38,38)' : 'rgb(196,167,254)' }} />
            <input
              name="addressLine1"
              value={form.addressLine1}
              onChange={set}
              placeholder="e.g. Al Fattan Tower, Villa 23, Shk Zayed Rd"
              style={{ ...fieldStyle(!!errors.addressLine1), paddingLeft: '34px' }}
              {...focus(!!errors.addressLine1)}
            />
          </div>
          <AnimatePresence><FieldError message={errors.addressLine1} /></AnimatePresence>
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
              style={fieldStyle(false)}
              {...focus(false)}
            />
          </div>

          <div>
            <label style={lbl}>
              Nearest Landmark <span style={opt}>optional</span>
            </label>
            <div className="relative">
              <Navigation size={13} className="absolute left-3 top-[13px] pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <input
                name="landmark"
                value={form.landmark}
                onChange={set}
                placeholder="e.g. Near Mall of Emirates"
                style={{ ...fieldStyle(false), paddingLeft: '34px' }}
                {...focus(false)}
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
          <div style={errors.customerPhone ? { outline: '1px solid rgba(252,165,165,0.9)', borderRadius: '12px' } : {}}>
            <PhoneNumberInput value={form.customerPhone} onChange={set} />
          </div>
          <AnimatePresence><FieldError message={errors.customerPhone} /></AnimatePresence>
        </div>

        {/* ── Label + Default ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">

          <div>
            <label style={lbl}>
              Address Label <span style={opt}>optional</span>
            </label>
            <div className="relative">
              <Tag size={13} className="absolute left-3 top-[13px] pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <input
                name="addressLabel"
                value={form.addressLabel}
                onChange={set}
                placeholder="e.g. Home, Office, Villa…"
                style={{ ...fieldStyle(false), paddingLeft: '34px' }}
                {...focus(false)}
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

        {/* ── API save error banner ── */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(254,226,226,0.75)',
                border: '1px solid rgba(252,165,165,0.45)',
                color: 'rgb(185,28,28)',
              }}
            >
              <AlertCircle size={15} className="shrink-0" />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{saveError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Buttons ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.98] disabled:opacity-40"
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
            disabled={saving}
            className="flex-1 py-3 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.98] disabled:opacity-80 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(147,51,234,0.2)',
            }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              'Save Address'
            )}
          </button>
        </div>

      </div>
    </form>
  );
}
