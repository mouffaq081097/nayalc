'use client';
import React from 'react';
import { Truck } from 'lucide-react';
import { PO_STATUS, fmtMoney, poNumber, prNumber } from '@/lib/erp/documents';
import DocumentIndex from '../_components/DocumentIndex';
import { StatusBadge, fmtDate, secondary, subdued, text, usePurchasing } from '../_components/purchasingUi';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
const isLate = (o) => ['sent', 'partially_received'].includes(o.status) && o.expected_date && o.expected_date.slice(0, 10) < today();

const VIEWS = [
  { id: 'open', label: 'Open', match: o => ['draft', 'sent', 'partially_received'].includes(o.status) },
  { id: 'draft', label: 'Drafts', match: o => o.status === 'draft' },
  { id: 'sent', label: 'Waiting for goods', match: o => ['sent', 'partially_received'].includes(o.status) },
  { id: 'late', label: 'Late', match: isLate },
  { id: 'done', label: 'Received & closed', match: o => ['received', 'closed'].includes(o.status) },
  { id: 'all', label: 'All', match: () => true },
];

const searchText = (o) => `${poNumber(o.id)} ${o.supplier_name} ${o.requisition_id ? prNumber(o.requisition_id) : ''}`;

const COLUMNS = [
  { label: 'Purchase order', render: o => <span className="font-semibold" style={text}>{poNumber(o.id)}</span> },
  { label: 'Status', render: o => <span className="inline-flex gap-1.5"><StatusBadge map={PO_STATUS} status={o.status} />{isLate(o) && <span className="sp-badge sp-badge-critical">Late</span>}</span> },
  { label: 'Supplier', render: o => <span style={secondary}>{o.supplier_name}</span> },
  { label: 'Received', align: 'right', render: o => <span style={secondary}>{o.received_units} / {o.units}</span> },
  { label: 'Total', align: 'right', render: o => <span style={text}>{fmtMoney(o.total, o.currency)}</span> },
  { label: 'Ordered', render: o => <span style={secondary}>{fmtDate(o.order_date)}</span> },
  { label: 'Expected', render: o => <span style={secondary}>{fmtDate(o.expected_date)}</span> },
  { label: 'From', render: o => <span style={subdued}>{o.requisition_id ? prNumber(o.requisition_id) : '—'}</span> },
];

export default function PurchaseOrdersPage() {
  const { data, error, can } = usePurchasing('/api/admin/purchasing/orders');
  return (
    <DocumentIndex
      title="Purchase orders"
      subtitle="What we have ordered from suppliers, and what has arrived"
      rows={data?.orders}
      error={error}
      views={VIEWS}
      columns={COLUMNS}
      searchText={searchText}
      rowHref={o => `/admin/purchasing/orders/${o.id}`}
      newHref={can('buyer') ? '/admin/purchasing/orders/new' : null}
      newLabel="New purchase order"
      emptyIcon={Truck}
      emptyTitle="No purchase orders yet"
      emptyText="Turn an approved requisition into a purchase order, or create one directly."
    />
  );
}
