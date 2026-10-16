'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Store } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { CURRENCIES } from '@/lib/erp/documents';
import { EmptyState } from '../../_components/IndexToolbar';
import { ActionButton, Dialog, ErrorBanner, FieldLabel, PageHeader, api, secondary, subdued, text, usePurchasing } from '../_components/purchasingUi';

const EMPTY = {
  name: '', contact_name: '', email: '', phone: '', country: '', address: '', tax_number: '',
  currency: 'EUR', payment_terms: '', lead_days: '', notes: '', is_active: true,
};

const toForm = (s) => Object.fromEntries(Object.keys(EMPTY).map(k => [k, s[k] ?? EMPTY[k]]));

export default function SuppliersPage() {
  const { data, error, can, reload } = usePurchasing('/api/admin/purchasing/suppliers');
  const [editing, setEditing] = useState(null); // null | 'new' | supplier
  const [form, setForm] = useState(EMPTY);

  if (!data && !error) return <PageLoader />;
  const suppliers = data?.suppliers || [];
  const canEdit = can('buyer');

  const open = (supplier) => {
    setEditing(supplier || 'new');
    setForm(supplier ? toForm(supplier) : EMPTY);
  };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    try {
      const isNew = editing === 'new';
      await api(isNew ? '/api/admin/purchasing/suppliers' : `/api/admin/purchasing/suppliers/${editing.id}`, { method: isNew ? 'POST' : 'PUT', body: form });
      toast.success(isNew ? 'Supplier added' : 'Supplier saved');
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const input = (key, label, props = {}) => (
    <div>
      <FieldLabel htmlFor={`s_${key}`} optional={key !== 'name'}>{label}</FieldLabel>
      <input id={`s_${key}`} className="sp-input" value={form[key]} onChange={set(key)} {...props} />
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        subtitle="Who we buy from, in which currency and on what terms"
        actions={canEdit && <button type="button" onClick={() => open(null)} className="sp-btn sp-btn-primary"><Plus size={14} />Add supplier</button>}
      />
      <ErrorBanner>{error}</ErrorBanner>

      <div className="sp-card overflow-hidden">
        {suppliers.length === 0 ? (
          <EmptyState icon={Store} title="No suppliers yet" description="Add the brands and distributors you order from, e.g. GERnétic in France (EUR)." />
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr><th>Supplier</th><th>Contact</th><th>Currency</th><th>Terms</th><th className="text-right">Lead time</th><th className="text-right">Orders</th><th /></tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className={canEdit ? 'cursor-pointer' : undefined} onClick={canEdit ? () => open(s) : undefined}>
                    <td>
                      <span className="font-medium" style={text}>{s.name}</span>
                      {s.country && <span className="block text-[12px]" style={subdued}>{s.country}</span>}
                    </td>
                    <td style={secondary}>
                      {s.contact_name || '—'}
                      {s.email && <span className="block text-[12px]" style={subdued}>{s.email}</span>}
                    </td>
                    <td style={secondary}>{s.currency}</td>
                    <td style={secondary}>{s.payment_terms || '—'}</td>
                    <td className="text-right tabular-nums" style={secondary}>{s.lead_days != null ? `${s.lead_days} days` : '—'}</td>
                    <td className="text-right tabular-nums" style={secondary}>{s.order_count}{s.open_count ? ` (${s.open_count} open)` : ''}</td>
                    <td className="text-right">{!s.is_active && <span className="sp-badge sp-badge-neutral">Archived</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!editing}
        title={editing === 'new' ? 'Add supplier' : `Edit ${editing?.name || ''}`}
        onClose={() => setEditing(null)}
        footer={(
          <>
            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <ActionButton variant="primary" onClick={save} disabled={!form.name.trim()} busyText="Saving…">Save</ActionButton>
          </>
        )}
      >
        {input('name', 'Name', { maxLength: 200, autoFocus: true, placeholder: 'e.g. GERnétic International' })}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="s_currency">Currency</FieldLabel>
            <select id="s_currency" className="sp-input" value={form.currency} onChange={set('currency')}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {input('lead_days', 'Lead time (days)', { type: 'number', min: 0, max: 365 })}
        </div>
        {input('payment_terms', 'Payment terms', { maxLength: 200, placeholder: 'e.g. 50% advance, balance before shipping' })}
        <div className="grid grid-cols-2 gap-3">
          {input('contact_name', 'Contact person', { maxLength: 200 })}
          {input('country', 'Country', { maxLength: 100 })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {input('email', 'Email', { type: 'email', maxLength: 200 })}
          {input('phone', 'Phone', { maxLength: 50 })}
        </div>
        <div>
          <FieldLabel htmlFor="s_address" optional>Address</FieldLabel>
          <textarea id="s_address" rows={2} className="sp-input" value={form.address} maxLength={1000} onChange={set('address')} />
        </div>
        {input('tax_number', 'VAT / tax number', { maxLength: 50 })}
        <div>
          <FieldLabel htmlFor="s_notes" optional>Notes</FieldLabel>
          <textarea id="s_notes" rows={2} className="sp-input" value={form.notes} maxLength={2000} onChange={set('notes')} />
        </div>
        {editing !== 'new' && (
          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <input type="checkbox" checked={!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: !e.target.checked }))} className="w-4 h-4" style={{ accentColor: 'var(--sp-primary)' }} />
            <span className="text-[13px]" style={text}>Archived — can&apos;t be chosen on new orders</span>
          </label>
        )}
      </Dialog>
    </div>
  );
}
