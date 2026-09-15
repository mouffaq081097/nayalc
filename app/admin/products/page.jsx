'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Download, ExternalLink, Eye, EyeOff, MoreHorizontal, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { EmptyState, SearchBox, ViewPill, toolbarSelectStyle } from '../_components/IndexToolbar';
import { apiErrorMessage, brandName, fmtAed, productStatus, stockState } from './_components/productAdmin';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

// Draft and Hidden only appear once a product actually has that status
const VIEWS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'Active', match: p => productStatus(p).id === 'active' },
  { id: 'draft', label: 'Draft', match: p => productStatus(p).id === 'draft', optional: true },
  { id: 'hidden', label: 'Hidden', match: p => productStatus(p).id === 'hidden', optional: true },
  { id: 'low', label: 'Low stock', match: p => stockState(p.stock_quantity).id === 'low' },
  { id: 'out', label: 'Out of stock', match: p => stockState(p.stock_quantity).id === 'out' },
];

const SORTS = {
  name:      { label: 'Name A–Z',           compare: (a, b) => a.name.localeCompare(b.name) },
  newest:    { label: 'Newest first',       compare: (a, b) => b.id - a.id },
  priceAsc:  { label: 'Price: low to high', compare: (a, b) => a.price - b.price },
  priceDesc: { label: 'Price: high to low', compare: (a, b) => b.price - a.price },
  stockAsc:  { label: 'Stock: low to high', compare: (a, b) => a.stock_quantity - b.stock_quantity },
};

function downloadCsv(products) {
  const escape = (value) => {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ['ID', 'Name', 'Brand', 'Status', 'Price (AED)', 'Compare-at price (AED)', 'Stock', 'Size', 'Form'],
    ...products.map(p => [p.id, p.name, brandName(p), productStatus(p).label, p.price, p.comparedprice ?? '', p.stock_quantity, p.size, p.form]),
  ];
  // The byte-order mark makes Excel read accents (Lumière, GERnétic) correctly
  const blob = new Blob([`﻿${rows.map(r => r.map(escape).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const ManageProducts = () => {
  const router = useRouter();
  const { adminProducts: products, brands, deleteProduct, toggleProductStatus, loading } = useAppContext();
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sort, setSort] = useState('name');

  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, products.filter(v.match).length])), [products]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matchesView = VIEWS.find(v => v.id === view).match;
    return products
      .filter(p => matchesView(p)
        && (brandFilter === 'all' || brandName(p) === brandFilter)
        && (!term || `${p.name} ${brandName(p)}`.toLowerCase().includes(term)))
      .sort(SORTS[sort].compare);
  }, [products, view, search, brandFilter, sort]);

  if (loading) return <PageLoader />;

  const handleVisibility = async (product) => {
    const show = product.is_active === false;
    try {
      await toggleProductStatus(product.id, show);
      toast.success(show ? `${product.name} is visible on the store` : `${product.name} is hidden from the store`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Visibility could not be changed.'));
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The product could not be deleted.'));
    }
  };

  const filtersActive = view !== 'all' || brandFilter !== 'all' || search.trim();
  const clearFilters = () => { setView('all'); setBrandFilter('all'); setSearch(''); };

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Products</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>{products.length} product{products.length !== 1 ? 's' : ''} in your catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => downloadCsv(visible)} disabled={visible.length === 0} className="sp-btn sp-btn-secondary">
            <Download size={14} />Export
          </button>
          <Link href="/admin/products/new" className="sp-btn sp-btn-primary"><Plus size={15} />Add product</Link>
        </div>
      </div>

      <div className="sp-card overflow-hidden">
        {/* Views, filters and search */}
        <div className="px-3 py-2 flex flex-col lg:flex-row lg:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
            {VIEWS.filter(v => !v.optional || counts[v.id] > 0 || view === v.id).map(v => (
              <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Filter by brand">
              <option value="all">All brands</option>
              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Sort products">
              {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
            <SearchBox value={search} onChange={setSearch} placeholder="Search products" />
          </div>
        </div>

        {visible.length === 0 ? (
          products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Add your first product"
              description="Products you add here appear in your store's collections and search."
              action={<Link href="/admin/products/new" className="sp-btn sp-btn-primary"><Plus size={15} />Add product</Link>}
            />
          ) : (
            <EmptyState
              icon={Package}
              title="No products match these filters"
              description="Try another view, brand or search term."
              action={filtersActive && <button type="button" onClick={clearFilters} className="sp-btn sp-btn-secondary">Clear filters</button>}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Inventory</th>
                  <th>Brand</th>
                  <th className="text-right">Price</th>
                  <th className="w-[52px]" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map(product => {
                  const status = productStatus(product);
                  const stock = stockState(product.stock_quantity);
                  const details = [product.size, product.form].filter(Boolean).join(' · ');
                  const compareAt = Number(product.comparedprice);
                  return (
                    <tr key={product.id} className="cursor-pointer" onClick={() => router.push(`/admin/products/${product.id}`)}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <div className="w-11 h-11 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center" style={{ border: '1px solid var(--sp-border)' }}>
                            {product.imageUrl
                              ? <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                              : <Package size={16} style={subdued} />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.id}`}
                              onClick={e => e.stopPropagation()}
                              className="block text-[13px] font-semibold truncate max-w-[360px] hover:underline"
                              style={text}
                            >
                              {product.name}
                            </Link>
                            {details && <p className="text-[12px] truncate max-w-[360px]" style={subdued}>{details}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap"><span className={`sp-badge ${status.cls}`}>{status.label}</span></td>
                      <td className="whitespace-nowrap" style={{ color: stock.color }}>{stock.label}</td>
                      <td className="whitespace-nowrap" style={secondary}>{brandName(product) || '—'}</td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-semibold">{fmtAed(product.price)}</span>
                        {compareAt > product.price && <span className="block text-[12px] line-through" style={subdued}>{fmtAed(compareAt)}</span>}
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-1.5 rounded-md hover:bg-[#ebebeb] cursor-pointer" aria-label={`Actions for ${product.name}`}>
                              <MoreHorizontal size={16} style={secondary} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[180px]">
                            <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.id}`)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <Pencil size={14} />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/product/${product.id}`, '_blank')} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <ExternalLink size={14} />View on store
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleVisibility(product)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              {product.is_active === false ? <><Eye size={14} />Show on store</> : <><EyeOff size={14} />Hide from store</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(product)} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
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
            Showing {visible.length} of {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
