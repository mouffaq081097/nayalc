'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import AccountShell from '../../_components/AccountShell';
import { useAccountData } from '../../_components/useAccountData';
import { useUser } from '../../../context/UserContext';
import Modal from '../../../components/Modal';
import AddressInputForm from '../../../components/AddressInputForm';
import {
  addressLabel, addressLines, canDeleteAddress, formattedAddressPhone,
  addressPhoneNeedsFixing, isDefaultAddress,
} from '../../_components/addressDisplay';

/**
 * One saved address, with room to show it properly.
 *
 * This page used to be built from the older lavender glass system while the
 * rest of the account area is flat and white, and it rendered the same address
 * twice in two stacked cards. It now matches its neighbours and says each
 * thing once.
 */
export default function AddressDetailPage() {
  const { addressId } = useParams();
  const router = useRouter();
  const { wishlistItems } = useAccountData();
  const { shippingAddresses, addressesLoading, updateShippingAddress, deleteShippingAddress } = useUser();

  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy]                 = useState(false);

  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;
  const addr = (shippingAddresses || []).find(a => String(a.id) === String(addressId));

  const backLink = (
    <Link
      href="/account/addresses"
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft size={14} />
      All addresses
    </Link>
  );

  if (addressesLoading) {
    return (
      <AccountShell wishCount={wishCount} title="Address">
        <div className="py-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </AccountShell>
    );
  }

  if (!addr) {
    return (
      <AccountShell wishCount={wishCount} title="Address">
        <div className="w-full max-w-4xl space-y-4">
          {backLink}
          <div className="bg-white rounded-lg border border-[#eaeaea] py-14 px-6 text-center">
            <p className="text-[14px] font-semibold text-gray-900">This address isn&apos;t on your account</p>
            <p className="mt-1 text-[13px] text-gray-500">It may have been removed. Your other addresses are still saved.</p>
            <Link
              href="/account/addresses"
              className="mt-5 inline-flex items-center h-9 px-4 rounded-md bg-purple-600 text-white text-[13px] font-medium hover:bg-purple-700 transition-colors"
            >
              Back to addresses
            </Link>
          </div>
        </div>
      </AccountShell>
    );
  }

  const isDefault   = isDefaultAddress(addr);
  const lines       = addressLines(addr);
  const phone       = formattedAddressPhone(addr);
  const removable   = canDeleteAddress(addr);
  const phoneBroken = addressPhoneNeedsFixing(addr);

  const handleSave = async (formData) => {
    await updateShippingAddress({ ...formData, id: addr.id });
    toast.success('Address updated.');
    setIsEditOpen(false);
  };

  const handleUseThis = async () => {
    setBusy(true);
    try {
      await updateShippingAddress({ ...addr, isDefault: true });
      toast.success(`Orders will ship to ${addressLabel(addr)}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await deleteShippingAddress(addr.id);
      toast.success('Address removed.');
      router.push('/account/addresses');
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AccountShell wishCount={wishCount} title={addressLabel(addr)}>
      <div className="w-full max-w-4xl space-y-4">
        {backLink}

        <div
          className="bg-white rounded-lg border overflow-hidden"
          style={{
            borderColor: isDefault ? '#d8b4fe' : '#eaeaea',
            boxShadow: isDefault ? 'inset 3px 0 0 0 #9333ea' : undefined,
          }}
        >
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-[#eaeaea] flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-gray-900">{addressLabel(addr)}</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {isDefault ? 'Your orders ship here' : 'Saved address'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#f0f0f0] grid gap-5 lg:grid-cols-[1fr_16rem]">
              <div>
                <p className="text-[12px] text-gray-400 mb-1">Delivering to</p>
                {lines.length > 0
                  ? lines.map((line, i) => (
                      <p key={i} className="text-[13px] text-gray-700 leading-relaxed">{line}</p>
                    ))
                  : <p className="text-[13px] text-gray-400">No street address saved</p>}
              </div>

              <div className="lg:pl-6 lg:border-l lg:border-[#f0f0f0]">
                <p className="text-[12px] text-gray-400 mb-1">Contact number</p>
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-400 shrink-0" />
                  <p className="text-[13px] text-gray-700">{phone || 'No number saved'}</p>
                </div>
                {phoneBroken && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2">
                    <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      We can&apos;t reach this number. Edit the address to correct it, or the courier won&apos;t be able to call.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 border-t border-[#f0f0f0] bg-[#fcfcfc]">
            <button
              onClick={() => setIsEditOpen(true)}
              disabled={busy}
              className="h-8 px-3 rounded-md bg-gray-900 text-white text-[12px] font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              Edit address
            </button>
            {!isDefault && (
              <button
                onClick={handleUseThis}
                disabled={busy}
                className="text-[12px] font-medium text-purple-600 hover:text-purple-700 disabled:opacity-40"
              >
                Use this address
              </button>
            )}
            <div className="ml-auto">
              {removable ? (
                <button
                  onClick={handleDelete}
                  onBlur={() => setConfirmDelete(false)}
                  disabled={busy}
                  className={`text-[12px] font-medium disabled:opacity-40 ${
                    confirmDelete ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  {confirmDelete ? 'Confirm removal' : 'Remove'}
                </button>
              ) : (
                <span className="text-[12px] text-gray-400 cursor-default">
                  Kept — it&apos;s on a past order
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} size="max-w-3xl">
        <AddressInputForm
          initialData={addr}
          onSave={handleSave}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>
    </AccountShell>
  );
}
