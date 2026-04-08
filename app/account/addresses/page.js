'use client';

import React, { useState } from 'react';
import { AccountMobileTopBar } from '../_components/AccountMobileTopBar';
import { useAccountData } from '../_components/useAccountData';
import { AccountSectionTitle } from '../_components/AccountSectionTitle';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import AddressInputForm from '../../components/AddressInputForm';
import { Button } from '../../components/ui/button';
import { toast } from 'react-toastify';

export default function AccountAddressesPage() {
  const { isLoading: accountLoading } = useAccountData();
  const { shippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleSave = async (formData) => {
    try {
      if (editingAddress) {
        await updateShippingAddress({ ...formData, id: editingAddress.id });
        toast.success('Address updated successfully');
      } else {
        await addShippingAddress(formData);
        toast.success('Address added successfully');
      }
      setIsModalOpen(false);
      setEditingAddress(null);
    } catch (error) {
      toast.error('Error saving address');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteShippingAddress(id);
        toast.success('Address deleted');
      } catch (error) {
        toast.error('Error deleting address');
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
      <div className="px-4 pb-28 pt-6 md:px-6 md:pt-12 md:pb-32">
        <div className="mx-auto max-w-2xl md:max-w-[1400px]">
          <div className="flex items-center justify-between mb-6">
            <AccountSectionTitle
              eyebrow="Account"
              title="Addresses"
              subtitle="Delivery coordinates for your future orders."
            />
            <button
              onClick={() => openModal()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          {shippingAddresses.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/80 p-10 text-center shadow-sm backdrop-blur-xl">
              <MapPin size={40} strokeWidth={1.25} className="mx-auto text-black/20" />
              <p className="mt-4 text-sm font-semibold text-[#1d1d1f]">No addresses yet.</p>
              <p className="mt-2 text-sm text-neutral-600">
                Add an address to establish your delivery coordinates.
              </p>
              <Button
                variant="pillPrimary"
                size="pill"
                onClick={() => openModal()}
                className="mt-6 w-full"
              >
                Add New Address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shippingAddresses.map((addr, index) => (
                <div
                  key={addr.id || `addr-${index}`}
                  className="rounded-[var(--radius-card)] border border-black/[0.06] bg-white/85 p-5 shadow-sm backdrop-blur-xl flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">
                            {addr.addressLabel || 'Address'}
                        </p>
                        {addr.isDefault && (
                            <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-full uppercase">Primary</span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {[addr.addressLine1, addr.addressLine2, addr.city, addr.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => openModal(addr)} className="p-2 text-neutral-400 hover:text-black">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="p-2 text-neutral-400 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAddress(null); }} title={editingAddress ? "Edit Address" : "New Address"}>
        <div className="p-4">
          <AddressInputForm
            initialData={editingAddress}
            onSave={handleSave}
            onCancel={() => { setIsModalOpen(false); setEditingAddress(null); }}
          />
        </div>
      </Modal>
    </>
  );
}

