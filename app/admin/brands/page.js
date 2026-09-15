'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Award, ExternalLink, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { slugify } from '@/lib/slugify';
import { EmptyState, SearchBox, ViewPill, toolbarSelectStyle } from '../_components/IndexToolbar';
import { apiErrorMessage } from '../products/_components/productAdmin';
import { brandStatus, productCount } from './_components/brandAdmin';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

// Hidden only appears once a brand actually is hidden
const VIEWS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'visible', label: 'Visible', match: b => brandStatus(b).id === 'visible' },
  { id: 'hidden', label: 'Hidden', match: b => brandStatus(b).id === 'hidden', optional: true },
];

const SORTS = {
  name:     { label: 'Name A–Z',      compare: (a, b) => a.name.localeCompare(b.name) },
  products: { label: 'Most products', compare: (a, b) => productCount(b) - productCount(a) || a.name.localeCompare(b.name) },
};

const ManageBrands = () => {
  const router = useRouter();
  const { adminBrands: brands, deleteBrand, toggleBrandStatus, loading } = useAppContext();
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');

  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, brands.filter(v.match).length])), [brands]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matchesView = VIEWS.find(v => v.id === view).match;
    return brands
      .filter(b => matchesView(b) && (!term || b.name.toLowerCase().includes(term)))
      .sort(SORTS[sort].compare);
  }, [brands, view, search, sort]);

  if (loading) return <PageLoader />;

  const handleVisibility = async (brand) => {
    const show = brand.is_active === false;
    try {
      await toggleBrandStatus(brand.id, show);
      toast.success(show ? `${brand.name} is visible on the store` : `${brand.name} is hidden from the store`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Visibility could not be changed.'));
    }
  };

  const handleDelete = async (brand) => {
    const count = productCount(brand);
    if (count > 0) {
      toast.error(`${brand.name} still has ${count} product${count !== 1 ? 's' : ''}. Move them to another brand first, or hide the brand instead.`);
      return;
    }
    if (!window.confirm(`Delete the "${brand.name}" brand? This can't be undone.`)) return;
    try {
      await deleteBrand(brand.id);
      toast.success('Brand deleted');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The brand could not be deleted.'));
    }
  };

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Brands</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>
            {brands.length} brand{brands.length !== 1 ? 's' : ''} — the houses behind your products
          </p>
        </div>
        <Link href="/admin/brands/new" className="sp-btn sp-btn-primary self-start sm:self-auto"><Plus size={15} />Add brand</Link>
      </div>

      <div className="sp-card overflow-hidden">
        {/* Views, sort and search */}
        <div className="px-3 py-2 flex flex-col lg:flex-row lg:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
            {VIEWS.filter(v => !v.optional || counts[v.id] > 0 || view === v.id).map(v => (
              <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select value={sort} onChange={e => setSort(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Sort brands">
              {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
            <SearchBox value={search} onChange={setSearch} placeholder="Search brands" />
          </div>
        </div>

        {visible.length === 0 ? (
          brands.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Add your first brand"
              description="Brands are the houses behind your products, like GERnétic or Zorah. Each gets its own page in the store."
              action={<Link href="/admin/brands/new" className="sp-btn sp-btn-primary"><Plus size={15} />Add brand</Link>}
            />
          ) : (
            <EmptyState
              icon={Award}
              title="No brands match these filters"
              description="Try another view or search term."
              action={<button type="button" onClick={() => { setView('all'); setSearch(''); }} className="sp-btn sp-btn-secondary">Clear filters</button>}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="w-[52px]" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map(brand => {
                  const status = brandStatus(brand);
                  const count = productCount(brand);
                  const slug = slugify(brand.name);
                  return (
                    <tr key={brand.id} className="cursor-pointer" onClick={() => router.push(`/admin/brands/${brand.id}`)}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[280px]">
                          <div className="w-11 h-11 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center" style={{ border: '1px solid var(--sp-border)' }}>
                            {brand.imageurl
                              ? <img src={brand.imageurl} alt="" className="w-full h-full object-cover" />
                              : <Award size={16} style={subdued} />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/brands/${brand.id}`}
                              onClick={e => e.stopPropagation()}
                              className="block text-[13px] font-semibold truncate max-w-[380px] hover:underline"
                              style={text}
                            >
                              {brand.name}
                            </Link>
                            <p className="text-[12px] truncate max-w-[380px]" style={subdued}>/brand/{slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap" style={count ? secondary : subdued}>
                        {count ? `${count} product${count !== 1 ? 's' : ''}` : 'No products'}
                      </td>
                      <td className="whitespace-nowrap"><span className={`sp-badge ${status.cls}`}>{status.label}</span></td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-1.5 rounded-md hover:bg-[#ebebeb] cursor-pointer" aria-label={`Actions for ${brand.name}`}>
                              <MoreHorizontal size={16} style={secondary} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[180px]">
                            <DropdownMenuItem onClick={() => router.push(`/admin/brands/${brand.id}`)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <Pencil size={14} />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/brand/${slug}`, '_blank')} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <ExternalLink size={14} />View on store
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleVisibility(brand)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              {brand.is_active === false ? <><Eye size={14} />Show on store</> : <><EyeOff size={14} />Hide from store</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(brand)} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
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
            Showing {visible.length} of {brands.length} brand{brands.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageBrands;
