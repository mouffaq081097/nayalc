'use client';

import React, { useState } from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import Link from 'next/link';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import AddressInputForm from '../../components/AddressInputForm';
import { toast } from 'react-toastify';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(216,180,254,0.35)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 2px 16px rgba(147,51,234,0.06)',
};

export default function AccountAddressesPage() {
  const { isLoading: accountLoading } = useAccountData();
  const { shippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleSave = async (formData) => {
    try {
      if (editingAddress) {
        await updateShippingAddress({ ...formData, id: editingAddress.id });
        toast.success('Address updated');
      } else {
        await addShippingAddress(formData);
        toast.success('Address added');
      }
      setIsModalOpen(false);
      setEditingAddress(null);
    } catch (error) {
      toast.error('Error saving address');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this address?')) {
      try {
        await deleteShippingAddress(id);
        toast.success('Address removed');
      } catch (error) {
        toast.error('Error removing address');
      }
    }
  };

  const openModal = (address = null) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  return (
    <>
      <AccountMobileTopBar title="Addresses" />
      <div className="px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3 mb-6">
            <AccountSectionTitle
              eyebrow="Account"
              title="Addresses"
              subtitle="Your saved delivery locations."
            />
            <button
              onClick={() => openModal()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 mt-1"
              style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))', boxShadow: '0 4px 16px rgba(147,51,234,0.2)' }}
            >
              <Plus size={18} />
            </button>
          </div>

          {shippingAddresses.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ ...glass, border: '1.5px dashed rgba(216,180,254,0.5)' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(196,167,254,0.18)' }}>
                <MapPin size={24} strokeWidth={1.5} style={{ color: 'rgba(147,51,234,0.4)' }} />
              </div>
              <p className="text-base font-bold mb-1" style={{ color: '#3b0764' }}>No addresses yet</p>
              <p className="text-sm mb-5" style={{ color: 'rgba(59,7,100,0.45)' }}>
                Add an address for faster checkout.
              </p>
              <button
                onClick={() => openModal()}
                className="w-full py-3 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.15em]"
                style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))', boxShadow: '0 4px 16px rgba(147,51,234,0.2)' }}
              >
                Add New Address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {shippingAddresses.map((addr, index) => (
                <div
                  key={addr.id || `addr-${index}`}
                  onClick={() => openModal(addr)}
                  className="rounded-2xl p-5 flex justify-between items-start cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                  style={glass}
                >
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(196,167,254,0.18)', color: 'rgb(126,105,230)' }}>
                      <MapPin size={17} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-[13px] font-bold" style={{ color: '#3b0764' }}>
                          {addr.addressLabel || 'Address'}
                        </p>
                        {addr.isDefault && (
                          <span className="text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))' }}>
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(59,7,100,0.50)' }}>
                        {[addr.addressLine1, addr.addressLine2, addr.city, addr.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 rounded-xl transition-colors text-slate-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingAddress(null); }}
        title={editingAddress ? 'Edit Address' : 'New Address'}
        size="max-w-3xl"
      >
          <AddressInputForm
            initialData={editingAddress}
            onSave={handleSave}
            onCancel={() => { setIsModalOpen(false); setEditingAddress(null); }}
          />
      </Modal>
    </>
  );
}
