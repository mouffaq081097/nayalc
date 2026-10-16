'use client';
import React from 'react';
import { PackageCheck } from 'lucide-react';
import { COSTING_STATUS, GRN_STATUS, grnNumber, poNumber } from '@/lib/erp/documents';
import DocumentIndex from '../_components/DocumentIndex';
import { StatusBadge, aed, fmtDate, secondary, subdued, text, usePurchasing } from '../_components/purchasingUi';

const VIEWS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'draft', label: 'Drafts', match: g => g.status === 'draft' },
  { id: 'costing', label: 'Awaiting costing', match: g => g.status === 'posted' && g.costing_status === 'open' },
  { id: 'costed', label: 'Costed', match: g => g.costing_status === 'finalized' },
];

const searchText = (g) => `${grnNumber(g.id)} ${poNumber(g.purchase_order_id)} ${g.supplier_name} ${g.supplier_invoice || ''}`;

const COLUMNS = [
  { label: 'Receipt', render: g => <span className="font-semibold" style={text}>{grnNumber(g.id)}</span> },
  {
    label: 'Status',
    render: g => (
      <span className="inline-flex gap-1.5">
        <StatusBadge map={GRN_STATUS} status={g.status} />
        {g.status === 'posted' && <StatusBadge map={COSTING_STATUS} status={g.costing_status} />}
      </span>
    ),
  },
  { label: 'Purchase order', render: g => <span style={secondary}>{poNumber(g.purchase_order_id)}</span> },
  { label: 'Supplier', render: g => <span style={secondary}>{g.supplier_name}</span> },
  { label: 'Accepted', align: 'right', render: g => <span style={secondary}>{g.units}{g.rejected ? ` (+${g.rejected} rejected)` : ''}</span> },
  { label: 'Value', align: 'right', render: g => <span style={text}>{aed(g.value_aed)}</span> },
  { label: 'Received', render: g => <span style={subdued}>{fmtDate(g.received_date)}</span> },
];

export default function ReceiptsPage() {
  const { data, error } = usePurchasing('/api/admin/purchasing/receipts');
  return (
    <DocumentIndex
      title="Goods received"
      subtitle="Deliveries counted against purchase orders (GRN). Open a purchase order to receive goods on it."
      rows={data?.receipts}
      error={error}
      views={VIEWS}
      columns={COLUMNS}
      searchText={searchText}
      rowHref={g => `/admin/purchasing/receipts/${g.id}`}
      emptyIcon={PackageCheck}
      emptyTitle="Nothing received yet"
      emptyText="When a delivery arrives, open its purchase order and choose Receive goods."
    />
  );
}
