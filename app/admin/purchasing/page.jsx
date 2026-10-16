'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardList, FileCheck2, PackageCheck, Plus, Receipt, Truck } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import { roleLabel } from '@/lib/erp/roles';
import { EmptyState } from '../_components/IndexToolbar';
import { ErrorBanner, MobileCard, PageHeader, SectionCard, StatCell, StatGrid, aed, secondary, subdued, text, usePurchasing } from './_components/purchasingUi';

const STEPS = [
  { href: '/admin/purchasing/requisitions', icon: ClipboardList, title: '1. Requisition (PR)', body: 'Someone asks for stock. An approver approves or rejects it.' },
  { href: '/admin/purchasing/orders', icon: Truck, title: '2. Purchase order (PO)', body: 'A buyer orders the approved stock from a supplier, in their currency, and sends the PDF.' },
  { href: '/admin/purchasing/receipts', icon: PackageCheck, title: '3. Goods received (GRN)', body: 'The storekeeper counts what arrived. Posting it adds the stock and fills waiting pre-orders.' },
  { href: '/admin/purchasing/costing', icon: Receipt, title: '4. Costing', body: 'Finance adds freight, customs and bank charges. Product costs update as a weighted average.' },
];

export default function PurchasingOverviewPage() {
  const router = useRouter();
  const { data, error, can } = usePurchasing('/api/admin/purchasing/overview');
  if (!data && !error) return <PageLoader />;
  const o = data?.overview;
  const access = data?.access;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Purchasing"
        subtitle={access && (access.full ? 'You have full access' : access.roles.length ? `Your roles: ${access.roles.map(roleLabel).join(', ')}` : 'You can view purchasing but have no roles yet')}
        actions={(
          <>
            {can('requester') && <Link href="/admin/purchasing/requisitions/new" className="sp-btn sp-btn-secondary"><Plus size={14} />New requisition</Link>}
            {can('buyer') && <Link href="/admin/purchasing/orders/new" className="sp-btn sp-btn-primary"><Plus size={14} />New purchase order</Link>}
          </>
        )}
      />
      <ErrorBanner>{error}</ErrorBanner>

      {o && (
        <>
          <StatGrid>
              <StatCell label="Awaiting approval" value={o.awaiting_approval} hint="requisitions" href="/admin/purchasing/requisitions?view=submitted" />
              <StatCell label="Approved, not ordered" value={o.approved_to_order} hint="ready for a PO" href="/admin/purchasing/requisitions?view=approved" />
              <StatCell label="Open purchase orders" value={o.open_orders} hint={o.late_orders ? `${o.late_orders} past expected date` : 'none late'} href="/admin/purchasing/orders?view=open" />
              <StatCell label="Awaiting costing" value={o.awaiting_costing} hint="posted receipts" href="/admin/purchasing/costing" />
              <StatCell label="Stock value" value={aed(o.stock_value)} hint={o.uncosted_products ? `${o.uncosted_products} products have no cost` : 'at average cost'} href="/admin/purchasing/costing" />
          </StatGrid>

          {/* Phones: compact rows with the icon beside the text */}
          <div className="grid gap-2 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map(step => (
              <Link key={step.href} href={step.href} className="sp-card px-4 py-3 md:p-5 flex md:block items-start gap-3 hover:bg-[#fafafa] transition-colors">
                <step.icon size={18} className="shrink-0 mt-0.5 md:mt-0" style={secondary} />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold md:mt-3" style={text}>{step.title}</p>
                  <p className="text-[13px] mt-0.5 md:mt-1 leading-relaxed" style={subdued}>{step.body}</p>
                </div>
              </Link>
            ))}
          </div>

          <SectionCard
            title="Customers waiting, not yet on order"
            hint="Pre-ordered units that no open purchase order covers"
            action={o.shortfalls.length > 0 && can('requester') && (
              <Link href="/admin/purchasing/requisitions/new?from=backorders" className="sp-btn sp-btn-secondary"><FileCheck2 size={14} />Request these</Link>
            )}
          >
            {o.shortfalls.length === 0 ? (
              <EmptyState icon={PackageCheck} title="Everything owed is covered" description="Every pre-ordered unit is on the shelf or on an open purchase order." />
            ) : (
              <>
              <div className="md:hidden">
                {o.shortfalls.map(p => (
                  <MobileCard
                    key={p.id}
                    title={p.name}
                    badge={<span className="sp-badge sp-badge-attention">{p.owed - p.on_order} to order</span>}
                    fields={[{ label: 'Owed', value: p.owed }, { label: 'On order', value: p.on_order }]}
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                  />
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="sp-table">
                  <thead>
                    <tr><th>Product</th><th className="text-right">Owed</th><th className="text-right">On order</th><th className="text-right">Still to order</th><th /></tr>
                  </thead>
                  <tbody>
                    {o.shortfalls.map(p => (
                      <tr key={p.id}>
                        <td><Link href={`/admin/products/${p.id}`} className="font-medium hover:underline" style={text}>{p.name}</Link></td>
                        <td className="text-right tabular-nums" style={secondary}>{p.owed}</td>
                        <td className="text-right tabular-nums" style={secondary}>{p.on_order}</td>
                        <td className="text-right font-semibold tabular-nums" style={text}>{p.owed - p.on_order}</td>
                        <td className="text-right"><Link href="/admin/backorders" className="inline-flex items-center gap-1 text-[13px] hover:underline" style={secondary}>Backorders<ArrowRight size={13} /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
