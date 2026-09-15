'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { AlertCircle, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { EmptyState, SearchBox, ViewPill, toolbarSelectStyle } from '../_components/IndexToolbar';
import { apiErrorMessage } from '../products/_components/productAdmin';
import { couponStatus, couponSummary, daysUntil, discountLabel, fmtDubaiDate } from './_components/couponAdmin';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

// Expired, Limit reached and Disabled only appear when a code has that status
const VIEWS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'Active', match: c => couponStatus(c).id === 'active' },
  { id: 'expired', label: 'Expired', match: c => couponStatus(c).id === 'expired', optional: true },
  { id: 'limit', label: 'Limit reached', match: c => couponStatus(c).id === 'limit', optional: true },
  { id: 'disabled', label: 'Disabled', match: c => couponStatus(c).id === 'disabled', optional: true },
];

const SORTS = {
  newest: { label: 'Newest first', compare: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  used:   { label: 'Most used',    compare: (a, b) => b.usage_count - a.usage_count },
  code:   { label: 'Code A–Z',     compare: (a, b) => a.code.localeCompare(b.code) },
};

const endsLabel = (coupon) => {
  if (!coupon.expiration_date) return { main: 'No end date', sub: null };
  const days = daysUntil(coupon.expiration_date);
  let sub;
  if (days < 0) sub = 'Ended';
  else if (days === 0) sub = 'Ends today';
  else if (days === 1) sub = 'Ends tomorrow';
  else sub = `In ${days} days`;
  return { main: fmtDubaiDate(coupon.expiration_date), sub };
};

const DiscountsPage = () => {
  const router = useRouter();
  const { fetchWithAuth } = useAppContext();
  const [coupons, setCoupons] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Discounts could not be loaded.');
      setCoupons(data);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => coupons || [], [coupons]);
  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, list.filter(v.match).length])), [list]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matchesView = VIEWS.find(v => v.id === view).match;
    return list
      .filter(c => matchesView(c) && (!term || c.code.toLowerCase().includes(term)))
      .sort(SORTS[sort].compare);
  }, [list, view, search, sort]);

  if (!coupons && !error) return <PageLoader />;

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error('The code could not be copied.');
    }
  };

  const toggleActive = async (coupon) => {
    const enable = coupon.is_active === false;
    try {
      await fetchWithAuth(`/api/coupons/${coupon.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: enable }) });
      setCoupons(prev => prev.map(c => (c.id === coupon.id ? { ...c, is_active: enable } : c)));
      toast.success(enable ? `${coupon.code} is enabled` : `${coupon.code} is disabled`);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The discount could not be updated.'));
    }
  };

  const handleDelete = async (coupon) => {
    const uses = coupon.order_count + coupon.cancelled_count;
    if (uses > 0) {
      toast.error(`${coupon.code} was used on ${uses} order${uses !== 1 ? 's' : ''}, so it can't be deleted. Disable it instead.`);
      return;
    }
    if (!window.confirm(`Delete the discount code ${coupon.code}? This can't be undone.`)) return;
    try {
      await fetchWithAuth(`/api/coupons/${coupon.id}`, { method: 'DELETE' });
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      toast.success('Discount deleted');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The discount could not be deleted.'));
    }
  };

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Discounts</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>Codes customers enter at checkout for money off their order</p>
        </div>
        <Link href="/admin/coupons/new" className="sp-btn sp-btn-primary self-start sm:self-auto"><Plus size={15} />Create discount</Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={14} />{error}
        </div>
      )}

      <div className="sp-card overflow-hidden">
        {/* Views, sort and search */}
        <div className="px-3 py-2 flex flex-col lg:flex-row lg:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
            {VIEWS.filter(v => !v.optional || counts[v.id] > 0 || view === v.id).map(v => (
              <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select value={sort} onChange={e => setSort(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Sort discounts">
              {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
            <SearchBox value={search} onChange={setSearch} placeholder="Search codes" />
          </div>
        </div>

        {visible.length === 0 ? (
          list.length === 0 ? (
            <EmptyState
              icon={Percent}
              title="Create your first discount"
              description="Give customers a code for a percentage or fixed amount off their order."
              action={<Link href="/admin/coupons/new" className="sp-btn sp-btn-primary"><Plus size={15} />Create discount</Link>}
            />
          ) : (
            <EmptyState
              icon={Percent}
              title="No discounts match these filters"
              description="Try another view or search term."
              action={<button type="button" onClick={() => { setView('all'); setSearch(''); }} className="sp-btn sp-btn-secondary">Clear filters</button>}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Used</th>
                  <th>Ends</th>
                  <th className="w-[52px]" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map(coupon => {
                  const status = couponStatus(coupon);
                  const ends = endsLabel(coupon);
                  const [, minimumLine] = couponSummary(coupon);
                  return (
                    <tr key={coupon.id} className="cursor-pointer" onClick={() => router.push(`/admin/coupons/${coupon.id}`)}>
                      <td>
                        <div className="min-w-[240px]">
                          <Link
                            href={`/admin/coupons/${coupon.id}`}
                            onClick={e => e.stopPropagation()}
                            className="text-[13px] font-semibold tracking-wide hover:underline"
                            style={text}
                          >
                            {coupon.code}
                          </Link>
                          <p className="text-[12px]" style={subdued}>
                            {discountLabel(coupon.discount_type, coupon.discount_value)} · {minimumLine}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap"><span className={`sp-badge ${status.cls}`}>{status.label}</span></td>
                      <td className="whitespace-nowrap" style={secondary}>
                        {coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''} use{coupon.usage_count !== 1 ? 's' : ''}
                        <span className="block text-[12px]" style={subdued}>
                          {coupon.order_count} order{coupon.order_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="whitespace-nowrap" style={secondary}>
                        {ends.main}
                        {ends.sub && <span className="block text-[12px]" style={subdued}>{ends.sub}</span>}
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-1.5 rounded-md hover:bg-[#ebebeb] cursor-pointer" aria-label={`Actions for ${coupon.code}`}>
                              <MoreHorizontal size={16} style={secondary} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[180px]">
                            <DropdownMenuItem onClick={() => router.push(`/admin/coupons/${coupon.id}`)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <Pencil size={14} />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyCode(coupon.code)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <Copy size={14} />Copy code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(coupon)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              {coupon.is_active === false ? <><Eye size={14} />Enable</> : <><EyeOff size={14} />Disable</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(coupon)} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
                              <Trash2 size={14} />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > 0 && (
          <p className="px-4 py-2.5 text-[12px]" style={{ ...subdued, borderTop: '1px solid var(--sp-border)' }}>
            Showing {visible.length} of {list.length} discount{list.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscountsPage;
