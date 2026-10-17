'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import AddressInputForm from '../../components/AddressInputForm';
import {
  addressLabel, addressLines, canDeleteAddress, formattedAddressPhone,
  addressPhoneNeedsFixing, isDefaultAddress,
} from '../_components/addressDisplay';

/**
 * Addresses (after Pitaka): a back link, a big title with an outlined
 * "+ Add address" pill, then every saved address as a plain card with a thin
 * ink border — the default first, marked "Default" — and small underlined
 * Edit / Delete links. Other addresses can be made the default from their card.
 */

function PhoneWarning() {
  return (
    <div className="mt-4 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2">
      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
      <p className="text-[12px] text-amber-700 leading-relaxed">
        We can&apos;t reach this number. Edit the address to correct it, or the courier won&apos;t be able to call.
      </p>
    </div>
  );
}

const LINK = 'text-[13px] text-[#6b6b72] underline underline-offset-2 hover:text-[#111114] disabled:opacity-40 transition-colors';

function AddressCard({ address, busy, confirming, onEdit, onRemove, onUseThis }) {
  const isDefault = isDefaultAddress(address);
  const lines = addressLines(address);
  const phone = formattedAddressPhone(address);
  const label = addressLabel(address);
  // The label is only worth a line when the customer named it (Home, Office…)
  const tag = [isDefault && 'Default', label !== 'Address' && label].filter(Boolean).join(' · ');

  return (
    <div className="border border-[#111114] rounded-md p-6 md:p-8 flex flex-col">
      {tag && <p className="text-[12px] uppercase tracking-wide text-[#6b6b72] mb-3">{tag}</p>}
      <div className="text-[16px] md:text-[17px] leading-snug text-[#111114] flex-1">
        {lines.length > 0
          ? lines.map((line, i) => <div key={i}>{line}</div>)
          : <div className="text-[#8a8a93]">No street address saved</div>}
        {phone && <div className="mt-2 text-[14px] text-[#6b6b72]">{phone}</div>}
      </div>
      {addressPhoneNeedsFixing(address) && <PhoneWarning />}

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={onEdit} disabled={busy} className={LINK}>Edit</button>
        {canDeleteAddress(address) ? (
          <button type="button" onClick={onRemove} disabled={busy} className={confirming ? `${LINK} !text-red-600` : LINK}>
            {confirming ? 'Confirm delete' : 'Delete'}
          </button>
        ) : (
          // Said in the row, not a tooltip: phones have no hover
          <span className="text-[13px] text-[#8a8a93]">Used on a past order</span>
        )}
        {!isDefault && (
          <button type="button" onClick={onUseThis} disabled={busy} className={LINK}>Set as default</button>
        )}
      </div>
    </div>
  );
}

export default function AccountAddressesPage() {
  const {
    shippingAddresses, addressesLoading,
    addShippingAddress, updateShippingAddress, deleteShippingAddress,
  } = useUser();

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [confirmingId, setConfirmingId]     = useState(null);
  const [busyId, setBusyId]                 = useState(null);

  const addresses = useMemo(
    () => (Array.isArray(shippingAddresses) ? shippingAddresses : []),
    [shippingAddresses],
  );
  // The default first, the rest as saved
  const sorted = useMemo(
    () => [...addresses].sort((a, b) => Number(isDefaultAddress(b)) - Number(isDefaultAddress(a))),
    [addresses],
  );

  const openAdd  = () => { setEditingAddress(null); setIsModalOpen(true); };
  const openEdit = (addr) => { setEditingAddress(addr); setIsModalOpen(true); };

  const handleSave = async (data) => {
    // The context now rethrows the server's own message, so a rejected phone
    // number surfaces here instead of being reported as a success.
    if (editingAddress) {
      await updateShippingAddress({ ...data, id: editingAddress.id });
      toast.success('Address updated.');
    } else {
      await addShippingAddress(data);
      toast.success('Address added.');
    }
    setIsModalOpen(false);
  };

  const handleUseThis = async (address) => {
    setBusyId(address.id);
    try {
      await updateShippingAddress({ ...address, isDefault: true });
      toast.success(`Orders will ship to ${addressLabel(address)}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (address) => {
    if (confirmingId !== address.id) { setConfirmingId(address.id); return; }

    setBusyId(address.id);
    try {
      await deleteShippingAddress(address.id);
      toast.success('Address removed.');

      // Removing the default would otherwise leave nothing marked, and
      // checkout has no address to preselect. Promote the next one.
      const remaining = addresses.filter(a => a.id !== address.id);
      if (isDefaultAddress(address) && remaining.length > 0) {
        try {
          await updateShippingAddress({ ...remaining[0], isDefault: true });
        } catch {
          toast.info('Choose which address your orders should ship to.');
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const cardProps = (a) => ({
    address: a,
    busy: busyId === a.id,
    confirming: confirmingId === a.id,
    onEdit: () => openEdit(a),
    onRemove: () => handleRemove(a),
    onUseThis: () => handleUseThis(a),
  });

  return (
    <div className="bg-white text-[#111114]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 pt-8 md:pt-14 pb-20" onMouseLeave={() => setConfirmingId(null)}>
        <Link href="/account" className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b72] hover:text-[#111114] transition-colors">
          <ArrowLeft size={14} strokeWidth={1.75} /> Back to account
        </Link>

        <div className="mt-6 md:mt-8 flex items-center justify-between gap-4">
          <h1 className="text-[28px] md:text-[36px] leading-tight tracking-tight">Your addresses</h1>
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 inline-flex items-center gap-1 h-10 md:h-11 px-4 md:px-6 rounded-full border border-[#111114] text-[14px] md:text-[15px] hover:bg-[#111114] hover:text-white transition-colors"
          >
            <Plus size={15} strokeWidth={1.75} /> Add address
          </button>
        </div>

        {addressesLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#e6e4df] border-t-[#111114] rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="mt-8 rounded-md bg-[#f6f5f2] py-14 px-6 text-center">
            <p className="text-[16px]">You haven&apos;t saved an address yet.</p>
            <p className="mt-1 text-[14px] text-[#6b6b72] max-w-sm mx-auto leading-relaxed">
              Add the address you want your orders sent to. You can save more than one and switch between them at checkout.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {sorted.map(a => <AddressCard key={a.id} {...cardProps(a)} />)}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="max-w-3xl">
        <AddressInputForm
          initialData={editingAddress}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
