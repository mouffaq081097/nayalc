'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import AccountShell from '../_components/AccountShell';
import { useAccountData } from '../_components/useAccountData';
import { useUser } from '../../context/UserContext';
import Modal from '../../components/Modal';
import AddressInputForm from '../../components/AddressInputForm';
import {
  addressLabel, addressLines, addressParts, canDeleteAddress, formattedAddressPhone,
  addressPhoneNeedsFixing, isDefaultAddress,
} from '../_components/addressDisplay';

/**
 * The page has one job: show where the next order is going, and make it quick
 * to change. So the default address is the subject of the page rather than one
 * more row in a list of equals — it gets its own heading and the only purple on
 * the screen, and every other address is presented as something you can
 * promote in its place.
 *
 * The layout follows the room the account shell actually gives it: the default
 * address spans the full width, and the rest tile across the remaining space,
 * up to three across on a wide monitor, so no column of dead space opens on
 * the right. Adding an address is a tile in that same grid rather than a bar
 * underneath it, which keeps the last row full and the action in view.
 */

function PhoneWarning() {
  return (
    <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2">
      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
      <p className="text-[11px] text-amber-700 leading-relaxed">
        We can&apos;t reach this number. Edit the address to correct it, or the courier won&apos;t be able to call.
      </p>
    </div>
  );
}

function AddressActions({ address, busy, confirming, onEdit, onRemove, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={onEdit}
        disabled={busy}
        className="text-[12px] font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
      >
        Edit
      </button>
      {canDeleteAddress(address) ? (
        <button
          onClick={onRemove}
          disabled={busy}
          className={`text-[12px] font-medium disabled:opacity-40 ${
            confirming ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
          }`}
        >
          {confirming ? 'Confirm removal' : 'Remove'}
        </button>
      ) : (
        // A tooltip explaining why Remove is missing never appears on a phone,
        // so say it in the row instead of hiding it behind a hover.
        <span className="text-[12px] text-gray-400 cursor-default">On a past order</span>
      )}
    </div>
  );
}

// Divider + padding applied to every summary column but the first.
const SUMMARY_COL = 'min-w-0 lg:border-l lg:border-[#f0f0f0] lg:pl-6';

function SummaryField({ label, children, className = '' }) {
  return (
    <div className={`${SUMMARY_COL} ${className}`}>
      <p className="text-[12px] text-gray-400">{label}</p>
      <div className="text-[13px] text-gray-700 mt-0.5 leading-relaxed break-words">{children}</div>
    </div>
  );
}

const NotSaved = () => <span className="text-gray-400">Not saved</span>;

/**
 * The default address as a summary row.
 *
 * Laying this out as "address on the left, contact on the right" pushed the
 * two blocks to opposite edges and left a thousand pixels of nothing between
 * them. The fields are now spread across the row as labelled columns instead,
 * which both fills the width honestly and answers a question the single
 * address block could not: with "Sharjah, Sharjah" on one line, there is no
 * telling which half is the community and which is the emirate.
 */
function DefaultAddressBar({ address, busy, confirming, onEdit, onRemove }) {
  const { street, area, emirate, country } = addressParts(address);
  const phone = formattedAddressPhone(address);

  return (
    <div
      className="bg-white rounded-lg border p-5"
      style={{ borderColor: '#d8b4fe', boxShadow: 'inset 3px 0 0 0 #9333ea' }}
    >
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">

        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-purple-500" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/account/addresses/${address.id}`}
              className="text-[14px] font-semibold text-gray-900 hover:text-purple-600 hover:underline underline-offset-2 transition-colors break-words"
            >
              {addressLabel(address)}
            </Link>
            <p className="text-[12px] text-gray-400 mt-0.5">Default delivery address</p>
          </div>
        </div>

        <SummaryField label="Street">{street || <NotSaved />}</SummaryField>

        <SummaryField label="Area">
          {area || emirate ? [area, emirate, country].filter(Boolean).join(', ') : <NotSaved />}
        </SummaryField>

        <SummaryField label="Contact number">
          {phone || <NotSaved />}
          {addressPhoneNeedsFixing(address) && <PhoneWarning />}
        </SummaryField>

        <div className={`${SUMMARY_COL} lg:pr-1`}>
          <p className="text-[12px] text-gray-400">Manage</p>
          <AddressActions
            address={address}
            busy={busy}
            confirming={confirming}
            onEdit={onEdit}
            onRemove={onRemove}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

/** Any other saved address, as a tile in the grid. */
function AddressCard({ address, busy, confirming, onEdit, onRemove, onUseThis }) {
  const lines = addressLines(address);
  const phone = formattedAddressPhone(address);

  return (
    <div className="bg-white rounded-lg border border-[#eaeaea] flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/account/addresses/${address.id}`}
            className="text-[13px] font-semibold text-gray-900 hover:text-purple-600 hover:underline underline-offset-2 transition-colors line-clamp-2"
          >
            {addressLabel(address)}
          </Link>
          <button
            onClick={onUseThis}
            disabled={busy}
            className="shrink-0 text-[12px] font-medium text-purple-600 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Use this address
          </button>
        </div>

        <div className="mt-2 text-[12px] text-gray-600 leading-relaxed">
          {lines.length > 0
            ? lines.map((line, i) => <div key={i}>{line}</div>)
            : <div className="text-gray-400">No street address saved</div>}
          {phone && <div className="text-gray-500 mt-1">{phone}</div>}
        </div>

        {addressPhoneNeedsFixing(address) && <PhoneWarning />}
      </div>

      <AddressActions
        address={address}
        busy={busy}
        confirming={confirming}
        onEdit={onEdit}
        onRemove={onRemove}
        className="px-4 py-2.5 border-t border-[#f0f0f0] bg-[#fcfcfc] rounded-b-lg"
      />
    </div>
  );
}

function AddAddressTile({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="min-h-[140px] w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#dcdcdc] text-[13px] font-medium text-gray-500 hover:bg-white hover:border-purple-300 hover:text-purple-600 transition-colors"
    >
      <Plus size={16} />
      Add an address
    </button>
  );
}

export default function AccountAddressesPage() {
  const { wishlistItems } = useAccountData();
  const {
    shippingAddresses, addressesLoading,
    addShippingAddress, updateShippingAddress, deleteShippingAddress,
  } = useUser();
  const wishCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [confirmingId, setConfirmingId]     = useState(null);
  const [busyId, setBusyId]                 = useState(null);

  const addresses = useMemo(
    () => (Array.isArray(shippingAddresses) ? shippingAddresses : []),
    [shippingAddresses],
  );
  const primary = addresses.find(isDefaultAddress) || null;
  const others  = addresses.filter(a => a !== primary);

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
    <AccountShell wishCount={wishCount}>
      <div className="w-full" onMouseLeave={() => setConfirmingId(null)}>

        {addressesLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#eaeaea] py-14 px-6 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mx-auto">
              <MapPin size={17} className="text-purple-500" />
            </div>
            <p className="mt-3 text-[14px] font-semibold text-gray-900">No delivery address yet</p>
            <p className="mt-1 text-[13px] text-gray-500 max-w-sm mx-auto leading-relaxed">
              Add the address you want your orders sent to. You can save more than one and switch between them at checkout.
            </p>
            <button
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-purple-600 text-white text-[13px] font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus size={14} />
              Add an address
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {primary && (
              <section>
                <h2 className="text-[13px] font-semibold text-gray-900 mb-2">Your orders ship here</h2>
                <DefaultAddressBar {...cardProps(primary)} />
              </section>
            )}

            <section>
              {others.length > 0 && (
                <>
                  <h2 className="text-[13px] font-semibold text-gray-900 mb-2">
                    {primary ? 'Other addresses' : 'Saved addresses'}
                  </h2>
                  {!primary && (
                    <p className="text-[12px] text-gray-500 -mt-1 mb-2">
                      Pick the one your orders should ship to.
                    </p>
                  )}
                </>
              )}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {others.map(a => <AddressCard key={a.id} {...cardProps(a)} />)}
                <AddAddressTile onClick={openAdd} />
              </div>
            </section>
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
    </AccountShell>
  );
}
