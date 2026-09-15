'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Download, Mail, MoreHorizontal, ShieldCheck, ShieldOff, UserCheck, UserRound, Users, UserX } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { EmptyState, SearchBox, ViewPill, toolbarSelectStyle } from '../_components/IndexToolbar';
import { fmtAed } from '../products/_components/productAdmin';
import {
  CustomerAvatar, changeAdminAccess, changeSuspension, customerLocation, customerName, fmtDate,
} from './_components/customerAdmin';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

// Admins and Suspended only appear when someone has that status
const VIEWS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'buyers', label: 'Has ordered', match: c => c.orders_count > 0 },
  { id: 'prospects', label: 'No orders yet', match: c => c.orders_count === 0 },
  { id: 'admins', label: 'Admins', match: c => c.is_admin, optional: true },
  { id: 'suspended', label: 'Suspended', match: c => c.is_suspended, optional: true },
];

const SORTS = {
  newest: { label: 'Newest first',  compare: (a, b) => new Date(b.created_at) - new Date(a.created_at) },
  spent:  { label: 'Most spent',    compare: (a, b) => b.total_spent - a.total_spent },
  orders: { label: 'Most orders',   compare: (a, b) => b.orders_count - a.orders_count },
  name:   { label: 'Name A–Z',      compare: (a, b) => customerName(a).localeCompare(customerName(b)) },
};

function downloadCsv(customers) {
  const escape = (value) => {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ['Name', 'Email', 'Phone', 'City', 'Country', 'Orders', 'Amount spent (AED)', 'Loyalty points', 'Tier', 'Joined', 'Admin', 'Suspended'],
    ...customers.map(c => [
      customerName(c), c.email, c.phone_number, c.city, c.country, c.orders_count, c.total_spent.toFixed(2),
      c.loyalty_points, c.loyalty_tier, fmtDate(c.created_at), c.is_admin ? 'Yes' : 'No', c.is_suspended ? 'Yes' : 'No',
    ]),
  ];
  // The byte-order mark makes Excel read accented names correctly
  const blob = new Blob([`﻿${rows.map(r => r.map(escape).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const CustomersPage = () => {
  const router = useRouter();
  const { fetchWithAuth } = useAppContext();
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Customers could not be loaded.');
      setCustomers(data);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => customers || [], [customers]);
  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, list.filter(v.match).length])), [list]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matchesView = VIEWS.find(v => v.id === view).match;
    return list
      .filter(c => matchesView(c)
        && (!term || `${customerName(c)} ${c.email || ''} ${c.phone_number || ''}`.toLowerCase().includes(term)))
      .sort(SORTS[sort].compare);
  }, [list, view, search, sort]);

  if (!customers && !error) return <PageLoader />;

  const updateCustomer = (id, changes) => setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...changes } : c)));
  const toggleAdmin = async (customer) => {
    if (await changeAdminAccess(fetchWithAuth, customer)) updateCustomer(customer.id, { is_admin: !customer.is_admin });
  };
  const toggleSuspension = async (customer) => {
    if (await changeSuspension(fetchWithAuth, customer)) updateCustomer(customer.id, { is_suspended: !customer.is_suspended });
  };

  const buyers = counts.buyers || 0;

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Customers</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>
            {list.length} customer{list.length !== 1 ? 's' : ''} · {buyers} ha{buyers !== 1 ? 've' : 's'} placed an order
          </p>
        </div>
        <button type="button" onClick={() => downloadCsv(visible)} disabled={visible.length === 0} className="sp-btn sp-btn-secondary self-start sm:self-auto">
          <Download size={14} />Export
        </button>
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
            <select value={sort} onChange={e => setSort(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Sort customers">
              {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
            <SearchBox value={search} onChange={setSearch} placeholder="Search name, email or phone" />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title={list.length === 0 ? 'No customers yet' : 'No customers match these filters'}
            description={list.length === 0 ? 'Customers appear here once they create an account.' : 'Try another view or search term.'}
            action={list.length > 0 && (
              <button type="button" onClick={() => { setView('all'); setSearch(''); }} className="sp-btn sp-btn-secondary">Clear filters</button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Orders</th>
                  <th className="text-right">Amount spent</th>
                  <th>Loyalty</th>
                  <th>Joined</th>
                  <th className="w-[52px]" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map(customer => {
                  const name = customerName(customer);
                  const location = customerLocation(customer);
                  return (
                    <tr key={customer.id} className="cursor-pointer" onClick={() => router.push(`/admin/users/${customer.id}`)}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <CustomerAvatar customer={customer} size={36} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/users/${customer.id}`}
                                onClick={e => e.stopPropagation()}
                                className="text-[13px] font-semibold truncate max-w-[240px] hover:underline"
                                style={text}
                              >
                                {name}
                              </Link>
                              {customer.is_admin && <span className="sp-badge sp-badge-info" style={{ padding: '2px 6px', fontSize: 11 }}>Admin</span>}
                              {customer.is_suspended && <span className="sp-badge sp-badge-critical" style={{ padding: '2px 6px', fontSize: 11 }}>Suspended</span>}
                            </div>
                            <p className="text-[12px] truncate max-w-[300px]" style={subdued}>{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap" style={location ? secondary : subdued}>{location || '—'}</td>
                      <td className="whitespace-nowrap" style={customer.orders_count ? secondary : subdued}>
                        {customer.orders_count ? `${customer.orders_count} order${customer.orders_count !== 1 ? 's' : ''}` : 'No orders'}
                      </td>
                      <td className="text-right whitespace-nowrap font-semibold" style={customer.total_spent ? text : subdued}>
                        {fmtAed(customer.total_spent)}
                      </td>
                      <td className="whitespace-nowrap" style={secondary}>
                        {Number(customer.loyalty_points).toLocaleString()} pts
                        {customer.loyalty_tier && <span className="block text-[12px]" style={subdued}>{customer.loyalty_tier}</span>}
                      </td>
                      <td className="whitespace-nowrap" style={secondary}>{fmtDate(customer.created_at)}</td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-1.5 rounded-md hover:bg-[#ebebeb] cursor-pointer" aria-label={`Actions for ${name}`}>
                              <MoreHorizontal size={16} style={secondary} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[200px]">
                            <DropdownMenuItem onClick={() => router.push(`/admin/users/${customer.id}`)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <UserRound size={14} />View customer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { window.location.href = `mailto:${customer.email}`; }} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <Mail size={14} />Email customer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleAdmin(customer)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              {customer.is_admin ? <><ShieldOff size={14} />Remove admin access</> : <><ShieldCheck size={14} />Give admin access</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleSuspension(customer)}
                              className={`rounded-md px-3 py-2 text-[13px] gap-2 ${customer.is_suspended ? '' : 'text-red-600 focus:bg-red-50'}`}
                            >
                              {customer.is_suspended ? <><UserCheck size={14} />Reinstate account</> : <><UserX size={14} />Suspend account</>}
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
            Showing {visible.length} of {list.length} customer{list.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
