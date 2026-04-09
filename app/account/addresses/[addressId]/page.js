'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '../../../context/UserContext';
import { AccountMobileTopBar } from '../../_components/AccountMobileTopBar';
import Modal from '../../../components/Modal';
import AddressInputForm from '../../../components/AddressInputForm';
import { MapPin, Edit2, Trash2, ArrowLeft, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../../../components/MapPicker'), { ssr: false });

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

export default function AddressDetailPage() {
  const { addressId } = useParams();
  const router = useRouter();
  const { shippingAddresses, updateShippingAddress, deleteShippingAddress } = useUser();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const addr = shippingAddresses.find(a => String(a.id) === String(addressId));

  if (!addr) {
    return (
      <>
        <AccountMobileTopBar title="Address" />
        <div className="px-4 pt-6 pb-28 text-center">
          <p className="text-sm" style={{ color: 'rgba(59,7,100,0.45)' }}>Address not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm font-bold" style={{ color: 'rgb(126,105,230)' }}>Go back</button>
        </div>
      </>
    );
  }

  const handleSave = async (formData) => {
    try {
      await updateShippingAddress({ ...formData, id: addr.id });
      toast.success('Address updated');
      setIsEditOpen(false);
    } catch {
      toast.error('Error updating address');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Remove this address?')) {
      try {
        await deleteShippingAddress(addr.id);
        toast.success('Address removed');
        router.push('/account/addresses');
      } catch {
        toast.error('Error removing address');
      }
    }
  };

  return (
    <>
      <AccountMobileTopBar title={addr.addressLabel || 'Address'} />

      <div className="px-4 pb-28 pt-4">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Back + actions row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[12px] font-bold"
              style={{ color: 'rgb(126,105,230)' }}
            >
              <ArrowLeft size={15} />
              Addresses
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all"
                style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)', border: '1px solid rgba(196,167,254,0.35)' }}
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all text-red-400 hover:text-red-600"
                style={{ background: 'rgba(254,226,226,0.5)', border: '1px solid rgba(252,165,165,0.3)' }}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>

          {/* Map */}
          {addr.latitude && addr.longitude ? (
            <div className="rounded-3xl overflow-hidden" style={{ height: '280px', border: '1px solid rgba(216,180,254,0.35)' }}>
              <MapPicker
                onPlaceSelect={() => {}}
                initialAddress={{ location: { lat: Number(addr.latitude), lng: Number(addr.longitude) } }}
                readOnly
              />
            </div>
          ) : (
            <div className="rounded-3xl flex items-center justify-center" style={{ height: '200px', background: 'rgba(196,167,254,0.1)', border: '1.5px dashed rgba(216,180,254,0.4)' }}>
              <div className="text-center">
                <MapPin size={28} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: 'rgba(196,167,254,0.6)' }} />
                <p className="text-[12px]" style={{ color: 'rgba(59,7,100,0.4)' }}>No map location saved</p>
              </div>
            </div>
          )}

          {/* Address info card */}
          <div className="rounded-3xl p-6 space-y-4" style={glass}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                  <MapPin size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[16px] font-bold tracking-tight" style={{ color: '#3b0764' }}>{addr.addressLabel || 'Address'}</p>
                  {addr.isDefault && (
                    <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full text-white inline-block mt-1" style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' }}>
                      Primary
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(216,180,254,0.25)' }}>
              {addr.addressLine1 && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(59,7,100,0.65)' }}>
                  {[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                </p>
              )}
              {(addr.city || addr.country) && (
                <p className="text-[13px]" style={{ color: 'rgba(59,7,100,0.55)' }}>
                  {[addr.city, addr.state, addr.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {addr.customerPhone && (
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(216,180,254,0.25)' }}>
                <Phone size={13} style={{ color: 'rgb(196,167,254)' }} />
                <p className="text-[13px] font-medium" style={{ color: 'rgba(59,7,100,0.65)' }}>{addr.customerPhone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Address"
        size="max-w-3xl"
      >
        <AddressInputForm
          initialData={addr}
          onSave={handleSave}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>
    </>
  );
}
