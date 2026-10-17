'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import PageLoader from '@/app/components/PageLoader';
import { canOpenPage, hasRole } from '@/lib/erp/roles';
import { CURRENCIES, PO_STATUS, PR_STATUS, fmtMoney, poNumber, prNumber } from '@/lib/erp/documents';
import LinesEditor, { linesPayload } from './LinesEditor';
import {
  ActionButton, Dialog, ErrorBanner, FieldLabel, MetaRow, Notice, PageHeader, SectionCard, StatusBadge, SupplierSelect,
  api, fmtDate, secondary, subdued, text, toDateInput, usePurchasingProducts, useSuppliers,
} from './purchasingUi';

const toLines = (items) => items.map(i => ({
  ...i,
  quantity: String(i.quantity),
  unit_price: i.unit_price == null ? '' : String(Number(i.unit_price)),
  note: i.note || '',
}));

/** id = null for a new requisition */
export default function RequisitionView({ id }) {
  const router = useRouter();
  const products = usePurchasingProducts();
  const suppliers = useSuppliers();
  const [access, setAccess] = useState(null);
  const [pr, setPr] = useState(null);
  const [form, setForm] = useState({ supplier_id: null, needed_by: '', notes: '', currency: 'AED' });
  const [lines, setLines] = useState([]);
  const [error, setError] = useState('');
  const [lineError, setLineError] = useState('');
  const [dialog, setDialog] = useState(null); // 'reject' | 'convert'
  const [note, setNote] = useState('');
  const [convertSupplier, setConvertSupplier] = useState(null);

  const load = (data) => {
    setAccess(data.access);
    if (data.requisition) {
      const r = data.requisition;
      setPr(r);
      setForm({ supplier_id: r.supplier_id, needed_by: toDateInput(r.needed_by), notes: r.notes || '', currency: r.currency || 'AED' });
      setLines(toLines(r.items));
    }
  };

  useEffect(() => {
    api(id ? `/api/admin/purchasing/requisitions/${id}` : '/api/admin/purchasing/me').then(load).catch(e => setError(e.message));
  }, [id]);

  // "Request these" on the overview: start with every pre-ordered unit no PO covers yet
  useEffect(() => {
    if (id || products.length === 0) return;
    if (new URLSearchParams(window.location.search).get('from') !== 'backorders') return;
    setLines(prev => (prev.length ? prev : products
      .filter(p => p.owed > p.on_order)
      .map(p => ({ product_id: p.id, product_name: p.name, quantity: String(p.owed - p.on_order), unit_price: '', note: 'Owed to pre-orders' }))));
  }, [id, products]);

  if (!access && !error) return <PageLoader />;
  if (!access) return <ErrorBanner>{error}</ErrorBanner>;

  const isNew = !id;
  const isOwner = access.full || (hasRole(access, 'requester') && (isNew || pr?.requested_by === access.userId));
  const editable = isNew ? hasRole(access, 'requester') : pr?.status === 'draft' && isOwner;
  const status = pr?.status;

  const payload = () => {
    const { items, error: msg } = linesPayload(lines, { withPrice: true });
    if (msg) {
      setLineError(msg);
      throw new Error(msg);
    }
    setLineError('');
    return { supplier_id: form.supplier_id, needed_by: form.needed_by || null, notes: form.notes, currency: form.currency, items };
  };

  const save = async (submit) => {
    try {
      const body = payload();
      if (isNew) {
        const { requisition } = await api('/api/admin/purchasing/requisitions', { method: 'POST', body: { ...body, submit } });
        toast.success(submit ? `${requisition.number} sent for approval` : `${requisition.number} saved`);
        if (submit && requisition.approval_email_error) toast.error(requisition.approval_email_error);
        router.replace(`/admin/purchasing/requisitions/${requisition.id}`);
        return;
      }
      const { requisition } = await api(`/api/admin/purchasing/requisitions/${id}`, { method: 'PUT', body });
      if (submit) {
        await act('submit');
      } else {
        load({ access, requisition });
        toast.success('Saved');
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  async function act(action, extra = {}) {
    try {
      const result = await api(`/api/admin/purchasing/requisitions/${id}`, { method: 'POST', body: { action, ...extra } });
      setDialog(null);
      setNote('');
      if (result.purchaseOrderId) {
        toast.success(`${poNumber(result.purchaseOrderId)} created. Check the prices, then send it.`);
        router.push(`/admin/purchasing/orders/${result.purchaseOrderId}`);
        return;
      }
      load({ access, requisition: result.requisition });
      if (result.emailError) {
        // The action itself worked; only the approvers' email didn't go
        if (action !== 'resend_email') toast.success(ACTION_DONE[action]);
        toast.error(result.emailError);
      } else {
        toast.success(ACTION_DONE[action]);
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this draft requisition?')) return;
    try {
      await api(`/api/admin/purchasing/requisitions/${id}`, { method: 'DELETE' });
      toast.success('Requisition deleted');
      router.push('/admin/purchasing/requisitions');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const estimatedTotal = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
  const ownApproval = pr && pr.requested_by === access.userId && !access.full;
  const actions = [];
  if (editable) {
    actions.push(<ActionButton key="save" onClick={() => save(false)} busyText="Saving…">Save draft</ActionButton>);
    actions.push(<ActionButton key="submit" variant="primary" onClick={() => save(true)} busyText="Submitting…">Submit for approval</ActionButton>);
    if (!isNew) actions.unshift(<button key="delete" type="button" onClick={remove} className="sp-btn sp-btn-plain text-red-600">Delete</button>);
  }
  if (status === 'submitted') {
    if (pr.approval_email_sent_at && (isOwner || hasRole(access, 'approver'))) {
      actions.push(<ActionButton key="resend" variant="plain" onClick={() => act('resend_email')} busyText="Sending…">Resend email</ActionButton>);
    }
    if (isOwner) actions.push(<ActionButton key="withdraw" onClick={() => act('withdraw')}>Withdraw</ActionButton>);
    if (hasRole(access, 'approver') && !ownApproval) {
      actions.push(<button key="reject" type="button" onClick={() => setDialog('reject')} className="sp-btn sp-btn-secondary">Reject</button>);
      actions.push(<ActionButton key="approve" variant="primary" onClick={() => act('approve')} busyText="Approving…">Approve</ActionButton>);
    }
  }
  if (status === 'rejected' && isOwner) actions.push(<ActionButton key="reopen" onClick={() => act('reopen')}>Reopen and edit</ActionButton>);
  if (status === 'approved' && hasRole(access, 'buyer')) {
    actions.push(
      <button key="convert" type="button" onClick={() => { setConvertSupplier(pr.supplier_id); setDialog('convert'); }} className="sp-btn sp-btn-primary">
        Create purchase order
      </button>
    );
  }
  if (['draft', 'submitted', 'approved', 'rejected'].includes(status) && (isOwner || hasRole(access, 'approver')) && !editable) {
    actions.unshift(<ActionButton key="cancel" variant="plain" confirm="Cancel this requisition?" onClick={() => act('cancel')}>Cancel requisition</ActionButton>);
  }

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">
      <PageHeader
        back="/admin/purchasing/requisitions"
        title={isNew ? 'New requisition' : prNumber(pr?.id)}
        badges={pr && <StatusBadge map={PR_STATUS} status={pr.status} />}
        subtitle={pr && `Requested by ${pr.requested_by_name || '—'} on ${fmtDate(pr.created_at)}`}
        actions={actions}
      />
      <ErrorBanner>{error}</ErrorBanner>

      {isNew && !editable && <Notice tone="warning">You need the Requester role to raise requisitions.</Notice>}
      {status === 'submitted' && ownApproval && hasRole(access, 'approver') && (
        <Notice tone="info">You raised this requisition, so another approver has to approve it.</Notice>
      )}
      {status === 'submitted' && (isOwner || hasRole(access, 'approver')) && !pr.approval_email_sent_at && (
        <Notice tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <strong>The approvers haven&apos;t been emailed.</strong>{' '}
              {pr.approval_email_error || 'No approval email was sent for this requisition.'}
            </span>
            <ActionButton onClick={() => act('resend_email')} busyText="Sending…">Send approval email</ActionButton>
          </div>
        </Notice>
      )}
      {status === 'submitted' && pr.approval_email_sent_at && pr.approval_email_error && (isOwner || hasRole(access, 'approver')) && (
        <Notice tone="warning">The last resend failed: {pr.approval_email_error}</Notice>
      )}
      {status === 'rejected' && pr.decision_note && (
        <Notice tone="warning"><strong>Rejected by {pr.decided_by_name}:</strong> {pr.decision_note}</Notice>
      )}
      {status === 'approved' && (
        <Notice tone="success">Approved by {pr.decided_by_name} on {fmtDate(pr.decided_at)}{pr.decision_note ? ` — ${pr.decision_note}` : ''}. A buyer can now turn it into a purchase order.</Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <SectionCard
          title="Products"
          hint={editable ? 'What is needed, how many and the expected price for each. Stock, pre-orders and units already on order are shown under each product.' : undefined}
          action={editable ? (
            // The currency of the prices, chosen right where they're typed
            <label className="flex shrink-0 items-center gap-2 text-[13px] whitespace-nowrap" style={text}>
              Prices in
              <select id="pr_currency" className="sp-input" style={{ width: 88 }} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          ) : (
            <span className="shrink-0 text-[13px] whitespace-nowrap" style={subdued}>Prices in {pr?.currency || 'AED'}</span>
          )}
        >
          <LinesEditor lines={lines} onChange={setLines} products={products} withPrice withNote currency={form.currency} readOnly={!editable} error={lineError} />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Details" padded>
            {editable ? (
              <div className="space-y-4">
                <div>
                  <FieldLabel htmlFor="supplier" optional>Preferred supplier</FieldLabel>
                  <SupplierSelect
                    id="supplier" suppliers={suppliers} value={form.supplier_id} allowNone
                    onChange={v => setForm(f => ({ ...f, supplier_id: v, currency: (suppliers || []).find(s => s.id === v)?.currency || f.currency }))}
                  />
                  <p className="text-[12px] mt-1.5" style={subdued}>Choosing a supplier switches the prices to their currency. You can still change it above the products.</p>
                </div>
                <div>
                  <FieldLabel htmlFor="needed_by" optional>Needed by</FieldLabel>
                  <input id="needed_by" type="date" className="sp-input" value={form.needed_by} onChange={e => setForm(f => ({ ...f, needed_by: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel htmlFor="notes" optional>Notes for the approver</FieldLabel>
                  <textarea id="notes" rows={4} className="sp-input" value={form.notes} maxLength={2000} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div>
                <MetaRow label="Preferred supplier">{pr?.supplier_name || '—'}</MetaRow>
                <MetaRow label="Needed by">{fmtDate(pr?.needed_by)}</MetaRow>
                <MetaRow label="Prices in">{pr?.currency || 'AED'}</MetaRow>
                <MetaRow label="Estimated total"><span className="font-semibold tabular-nums">{fmtMoney(estimatedTotal, pr?.currency || 'AED')}</span></MetaRow>
                {pr?.notes && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--sp-border)' }}>
                    <p className="text-[12px] mb-1" style={subdued}>Notes from {pr.requested_by_name || 'the requester'}</p>
                    <p className="text-[13px] whitespace-pre-line" style={text}>{pr.notes}</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {pr && (
            <SectionCard title="History" padded>
              <ol className="space-y-3">
                {history(pr).map(e => (
                  <li key={e.key} className="flex gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                    <div className="min-w-0 text-[13px]">
                      <p style={text}>{e.label}</p>
                      {e.meta && <p className="text-[12px]" style={subdued}>{e.meta}</p>}
                      {e.note && <p className="text-[12px] mt-1 whitespace-pre-line" style={secondary}>{e.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          )}

          {pr?.purchase_orders?.length > 0 && (
            <SectionCard title="Purchase orders" padded>
              {pr.purchase_orders.map(po => (
                <div key={po.id} className="flex items-center justify-between py-1">
                  {canOpenPage(access, '/admin/purchasing/orders')
                    ? <Link href={`/admin/purchasing/orders/${po.id}`} className="text-[13px] font-medium hover:underline" style={text}>{poNumber(po.id)}</Link>
                    : <span className="text-[13px] font-medium" style={text}>{poNumber(po.id)}</span>}
                  <StatusBadge map={PO_STATUS} status={po.status} />
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      </div>

      <Dialog
        open={dialog === 'reject'}
        title="Reject requisition"
        onClose={() => setDialog(null)}
        footer={(
          <>
            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setDialog(null)}>Back</button>
            <ActionButton variant="primary" onClick={() => act('reject', { note })} disabled={!note.trim()} busyText="Rejecting…">Reject</ActionButton>
          </>
        )}
      >
        <div>
          <FieldLabel htmlFor="reject_note">Reason</FieldLabel>
          <textarea id="reject_note" rows={4} className="sp-input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Enough stock until next month — order half" autoFocus />
          <p className="text-[12px] mt-1.5" style={subdued}>The requester sees this and can reopen the requisition to fix it.</p>
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'convert'}
        title="Create purchase order"
        onClose={() => setDialog(null)}
        footer={(
          <>
            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setDialog(null)}>Back</button>
            <ActionButton variant="primary" onClick={() => act('convert', { supplier_id: convertSupplier })} disabled={!convertSupplier} busyText="Creating…">Create draft PO</ActionButton>
          </>
        )}
      >
        <div>
          <FieldLabel htmlFor="convert_supplier">Supplier</FieldLabel>
          <SupplierSelect id="convert_supplier" suppliers={suppliers} value={convertSupplier} onChange={setConvertSupplier} />
          <p className="text-[12px] mt-1.5" style={subdued}>
            The PO is created as a draft in the supplier&apos;s currency. Each product keeps this requisition&apos;s price when the supplier bills in {pr?.currency || 'AED'}; otherwise it takes the last price this supplier charged. Check it before sending.
            {suppliers?.length === 0 && <> <Link href="/admin/purchasing/suppliers" className="underline">Add a supplier</Link> first.</>}
          </p>
        </div>
      </Dialog>
    </div>
  );
}

const ACTION_DONE = {
  submit: 'Sent for approval', withdraw: 'Withdrawn — it is a draft again', approve: 'Approved', reject: 'Rejected',
  reopen: 'Reopened as a draft', cancel: 'Requisition cancelled', resend_email: 'Approval email sent',
};

/** What happened to a requisition so far, oldest first */
function history(pr) {
  const events = [{ key: 'created', label: 'Created', meta: `${pr.requested_by_name || '—'} · ${fmtDate(pr.created_at)}`, color: '#d4d4d4' }];
  if (pr.submitted_at) events.push({ key: 'submitted', label: 'Sent for approval', meta: fmtDate(pr.submitted_at), color: '#9368ec' });
  if (pr.approval_email_sent_at) events.push({ key: 'emailed', label: 'Approvers emailed', meta: fmtDate(pr.approval_email_sent_at), color: '#9368ec' });
  else if (pr.status === 'submitted') events.push({ key: 'not-emailed', label: 'Approvers not emailed', meta: "The email didn't go out", color: '#e22c38' });
  if (pr.decided_at) {
    const rejected = pr.status === 'rejected';
    events.push({
      key: 'decided',
      label: rejected ? 'Rejected' : 'Approved',
      meta: `${pr.decided_by_name || '—'} · ${fmtDate(pr.decided_at)}`,
      note: pr.decision_note,
      color: rejected ? '#e22c38' : '#29845a',
    });
  } else if (pr.status === 'submitted') {
    events.push({ key: 'waiting', label: 'Waiting for an approver', meta: 'No decision yet', color: '#ffd79d' });
  }
  if (pr.status === 'converted') events.push({ key: 'converted', label: 'Purchase order created', color: '#29845a' });
  if (pr.status === 'cancelled') events.push({ key: 'cancelled', label: 'Cancelled', color: '#8a8a8a' });
  return events;
}
