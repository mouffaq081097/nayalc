'use client';

import React, { useState } from 'react';
import PhoneNumberInput from './PhoneNumberInput';
import MapPicker from './MapPicker';
import { toast } from 'react-toastify';
import { Tag, Phone, MapPin } from 'lucide-react';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(216,180,254,0.45)',
  background: 'rgba(248,240,255,0.6)',
  color: '#3b0764',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(59,7,100,0.55)',
  marginBottom: '6px',
};

const AddressInputForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    addressLabel: initialData?.addressLabel || '',
    customerPhone: initialData?.customerPhone || initialData?.customer_phone || '',
    addressLine1: initialData?.addressLine1 || initialData?.address_line1 || '',
    apartment: initialData?.apartment || '',
    city: initialData?.city || '',
    country: initialData?.country || 'United Arab Emirates',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    isDefault: initialData?.isDefault || false,
    zipCode: initialData?.zipCode || initialData?.zip_code || '0000',
    state: initialData?.state || '',
  });
  const [locationError, setLocationError] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMapPlaceSelect = (placeDetails) => {
    if (placeDetails) {
      setFormData(prev => ({
        ...prev,
        addressLine1: placeDetails.streetAddress || placeDetails.formattedAddress || '',
        city: placeDetails.city || '',
        country: placeDetails.country || 'United Arab Emirates',
        zipCode: placeDetails.zipCode || prev.zipCode || '0000',
        state: placeDetails.state || '',
        latitude: placeDetails.lat,
        longitude: placeDetails.lng,
      }));
      setLocationError(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.latitude === null || formData.longitude === null) {
      setLocationError(true);
      toast.error('Please select a location on the map.');
      return;
    }
    if (!formData.addressLine1) { toast.error('Street address is missing from map selection.'); return; }
    if (!formData.city) { toast.error('City is missing from map selection.'); return; }
    if (!formData.country) { toast.error('Country is missing from map selection.'); return; }
    if (!formData.customerPhone) { toast.error('Phone number is required.'); return; }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Desktop: 2-column. Mobile: single column */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* LEFT COLUMN — fields */}
        <div className="flex flex-col gap-5 md:w-[42%] flex-shrink-0">

          {/* Address label */}
          <div>
            <label style={labelStyle}>Address Label</label>
            <div className="relative">
              <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgb(196,167,254)' }} />
              <input
                name="addressLabel"
                value={formData.addressLabel}
                onChange={handleChange}
                placeholder="e.g. Home, Office…"
                style={{ ...inputStyle, paddingLeft: '34px' }}
                onFocus={e => { e.target.style.borderColor = 'rgb(196,167,254)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,167,254,0.2)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(216,180,254,0.45)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Phone number */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <PhoneNumberInput value={formData.customerPhone} onChange={handleChange} />
          </div>

          {/* Set as default */}
          <label
            className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3"
            style={{ background: 'rgba(196,167,254,0.12)', border: '1px solid rgba(216,180,254,0.3)' }}
          >
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'rgb(126,105,230)' }}
            />
            <span className="text-[12px] font-semibold" style={{ color: '#3b0764' }}>Set as primary address</span>
          </label>

          {/* Spacer to push buttons to bottom on desktop */}
          <div className="flex-1 hidden md:block" />

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all"
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

        {/* RIGHT COLUMN — map */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <label style={labelStyle}>Pin your location</label>
          <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: locationError ? '1.5px solid rgba(239,68,68,0.5)' : '1px solid rgba(216,180,254,0.35)', minHeight: '280px' }}>
            <MapPicker
              onPlaceSelect={handleMapPlaceSelect}
              initialAddress={{
                location: formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null,
              }}
            />
          </div>
          {locationError && (
            <p className="text-[11px] font-semibold" style={{ color: 'rgb(239,68,68)' }}>Please pin your location on the map.</p>
          )}
        </div>
      </div>

      {/* Mobile-only buttons */}
      <div className="flex gap-3 mt-5 md:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ border: '1px solid rgba(216,180,254,0.45)', color: 'rgb(126,105,230)', background: 'rgba(248,240,255,0.6)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))', boxShadow: '0 4px 16px rgba(147,51,234,0.2)' }}
        >
          Save Address
        </button>
      </div>
    </form>
  );
};

export default AddressInputForm;
