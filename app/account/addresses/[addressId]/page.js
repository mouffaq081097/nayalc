'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '../../../context/UserContext';
import { AccountMobileTopBar } from '../../_components/AccountMobileTopBar';
import Modal from '../../../components/Modal';
import AddressInputForm from '../../../components/AddressInputForm';
import { MapPin, Edit2, Trash2, ArrowLeft, Phone, Building2, Navigation } from 'lucide-react';
import { toast } from 'react-toastify';

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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await deleteShippingAddress(addr.id);
      toast.success('Address removed');
      router.push('/account/addresses');
    } catch {
      toast.error('Error removing address');
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
                onBlur={() => setConfirmDelete(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] transition-all"
                style={confirmDelete
                  ? { background: 'rgb(220,38,38)', color: 'white', border: '1px solid rgb(220,38,38)' }
                  : { background: 'rgba(254,226,226,0.5)', color: 'rgb(248,113,113)', border: '1px solid rgba(252,165,165,0.3)' }}
              >
                <Trash2 size={12} /> {confirmDelete ? 'Confirm?' : 'Remove'}
              </button>
            </div>
          </div>

          {/* Address overview card */}
          <div
            className="rounded-3xl p-6"
            style={{ background: 'var(--brand-gradient)', border: '1px solid var(--ink-200)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.25)', color: 'rgb(126,105,230)' }}>
                <MapPin size={20} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-[17px] font-bold tracking-tight" style={{ color: '#3b0764' }}>{addr.addressLabel || 'Delivery Address'}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'rgb(196,167,254)' }}>{addr.city || 'UAE'}</p>
              </div>
            </div>
            <div className="space-y-2" style={{ borderTop: '1px solid rgba(216,180,254,0.25)', paddingTop: '16px' }}>
              {addr.addressLine1 && (
                <div className="flex items-start gap-2.5">
                  <Building2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'rgb(196,167,254)' }} />
                  <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(59,7,100,0.7)' }}>
                    {[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {(addr.state || addr.city) && (
                <div className="flex items-start gap-2.5">
                  <Navigation size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'rgb(196,167,254)' }} />
                  <p className="text-[13px]" style={{ color: 'rgba(59,7,100,0.55)' }}>
                    {[addr.state, addr.city, addr.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

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
                    <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full text-white inline-block mt-1" style={{ background: 'var(--brand-gradient)' }}>
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
