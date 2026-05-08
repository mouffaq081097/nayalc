'use client';

import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import AddressInputForm from '../../components/AddressInputForm';
import { toast } from 'react-toastify';

export default function AccountAddressesPage() {
  const { wishlistItems } = useAccountData();
  const { shippingAddresses, addShippingAddress, updateShippingAddress, deleteShippingAddress } = useUser();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const openAdd  = () => { setEditingAddress(null); setIsModalOpen(true); };
  const openEdit = (addr) => { setEditingAddress(addr); setIsModalOpen(true); };

  const handleSave = async (data) => {
    try {
      if (editingAddress) {
        await updateShippingAddress({ ...data, id: editingAddress.id });
        toast.success('Address updated.');
      } else {
        await addShippingAddress(data);
        toast.success('Address added.');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save address.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await deleteShippingAddress(id);
      toast.success('Address removed.');
    } catch (err) {
      toast.error(err?.message?.includes('409') ? 'This address is linked to existing orders.' : 'Failed to remove address.');
    }
  };

  return (
    <AccountShell wishCount={wishCount}>
      <div className="space-y-3">
        {shippingAddresses?.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No saved addresses yet.</p>
        )}

        {shippingAddresses?.map((a) => (
          <div key={a.id} className={`p-5 bg-white rounded-lg border transition-colors ${a.is_primary ? 'border-purple-300' : 'border-[#eaeaea]'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <span className="text-[12px] font-semibold text-gray-900">{a.addressLabel || a.address_label || a.label || 'Address'}</span>
                {a.is_primary && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(a)} className="text-[11px] text-purple-600 font-medium hover:underline">Edit</button>
                <span className="text-gray-300">·</span>
                <button onClick={() => handleDelete(a.id)} className="text-[11px] text-red-500 font-medium hover:underline">Delete</button>
              </div>
            </div>
            <div className="text-[12px] text-gray-700 leading-relaxed pl-5">
              <div className="font-medium">{a.first_name} {a.last_name}</div>
              <div>{a.address_line1}</div>
              {a.address_line2 && <div>{a.address_line2}</div>}
              <div>{[a.city, a.state, a.country].filter(Boolean).join(', ')}</div>
              {a.phone && <div className="text-gray-500 mt-0.5">{a.phone}</div>}
            </div>
          </div>
        ))}

        <button
          onClick={openAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-[#eaeaea] text-[13px] font-medium text-gray-400 hover:bg-white hover:border-gray-300 hover:text-gray-700 transition-colors"
        >
          <Plus size={14} />
          Add New Address
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="max-w-3xl">
        <AddressInputForm
          initialData={editingAddress}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </AccountShell>
  );
}
