'use client';
import React from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { PR_STATUS, fmtMoney, poNumber, prNumber } from '@/lib/erp/documents';
import { canOpenPage, isApproverOnly } from '@/lib/erp/roles';
import DocumentIndex from '../_components/DocumentIndex';
import { StatusBadge, fmtDate, secondary, subdued, text, usePurchasing } from '../_components/purchasingUi';

const VIEWS = [
  { id: 'open', label: 'Open', match: r => ['draft', 'submitted', 'approved', 'rejected'].includes(r.status) },
  { id: 'submitted', label: 'Awaiting approval', match: r => r.status === 'submitted' },
  { id: 'approved', label: 'Approved', match: r => r.status === 'approved' },
  { id: 'converted', label: 'Ordered', match: r => r.status === 'converted' },
  { id: 'all', label: 'All', match: () => true },
];

// An approver-only account sees just its queue, and what it decided
const APPROVER_VIEWS = [
  { id: 'submitted', label: 'Awaiting your approval', match: r => r.status === 'submitted' },
  { id: 'decided', label: 'Decided by you', match: r => r.status !== 'submitted' },
];

const searchText = (r) => `${prNumber(r.id)} ${r.supplier_name || ''} ${r.requested_by_name || ''}`;

const COLUMNS = [
  { label: 'Requisition', render: r => <span className="font-semibold" style={text}>{prNumber(r.id)}</span> },
  { label: 'Status', render: r => <StatusBadge map={PR_STATUS} status={r.status} /> },
  { label: 'Requested by', render: r => <span style={secondary}>{r.requested_by_name || '—'}</span> },
  { label: 'Supplier', render: r => <span style={secondary}>{r.supplier_name || '—'}</span> },
  { label: 'Products', align: 'right', render: r => <span style={secondary}>{r.line_count} · {r.units} units</span> },
  { label: 'Estimated total', align: 'right', render: r => (r.estimated_total == null
    ? <span style={subdued}>—</span>
    : <span className="tabular-nums" style={text}>{fmtMoney(r.estimated_total, r.currency || 'AED')}</span>) },
  { label: 'Needed by', render: r => <span style={secondary}>{fmtDate(r.needed_by)}</span> },
  { label: 'Created', render: r => <span style={subdued}>{fmtDate(r.created_at)}</span> },
];

const PO_COLUMN = {
  label: 'Purchase order',
  render: r => (r.purchase_order_id
    ? <Link href={`/admin/purchasing/orders/${r.purchase_order_id}`} onClick={e => e.stopPropagation()} className="hover:underline" style={text}>{poNumber(r.purchase_order_id)}</Link>
    : <span style={subdued}>—</span>),
};
const COLUMNS_WITH_PO = [...COLUMNS, PO_COLUMN];

export default function RequisitionsPage() {
  const { data, error, can } = usePurchasing('/api/admin/purchasing/requisitions');
  const approverOnly = isApproverOnly(data?.access);
  return (
    <DocumentIndex
      title={approverOnly ? 'Approvals' : 'Requisitions'}
      subtitle={approverOnly ? 'Purchase requisitions waiting for your approval' : 'Requests for stock. Approved requests become purchase orders.'}
      rows={data?.requisitions}
      error={error}
      views={approverOnly ? APPROVER_VIEWS : VIEWS}
      columns={canOpenPage(data?.access, '/admin/purchasing/orders') ? COLUMNS_WITH_PO : COLUMNS}
      searchText={searchText}
      rowHref={r => `/admin/purchasing/requisitions/${r.id}`}
      newHref={can('requester') ? '/admin/purchasing/requisitions/new' : null}
      newLabel="New requisition"
      emptyIcon={ClipboardList}
      emptyTitle={approverOnly ? 'Nothing to approve' : 'No requisitions yet'}
      emptyText={approverOnly ? 'New requisitions appear here when they are submitted for your approval.' : 'Raise a requisition when stock is needed. It goes to an approver, then to a buyer.'}
    />
  );
}
