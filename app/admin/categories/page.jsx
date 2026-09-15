'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ExternalLink, Eye, EyeOff, FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { EmptyState, SearchBox, ViewPill, toolbarSelectStyle } from '../_components/IndexToolbar';
import { apiErrorMessage } from '../products/_components/productAdmin';
import { categoryStatus, productCount } from './_components/categoryAdmin';

const text = { color: 'var(--sp-text)' };
const secondary = { color: 'var(--sp-text-secondary)' };
const subdued = { color: 'var(--sp-text-subdued)' };

// Hidden only appears once a category actually is hidden
const VIEWS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'visible', label: 'Visible', match: c => categoryStatus(c).id === 'visible' },
  { id: 'hidden', label: 'Hidden', match: c => categoryStatus(c).id === 'hidden', optional: true },
  { id: 'empty', label: 'No products', match: c => productCount(c) === 0 },
];

const SORTS = {
  name:     { label: 'Name A–Z',      compare: (a, b) => a.name.localeCompare(b.name) },
  products: { label: 'Most products', compare: (a, b) => productCount(b) - productCount(a) || a.name.localeCompare(b.name) },
};

const ManageCategories = () => {
  const router = useRouter();
  const { adminCategories: categories, deleteCategory, toggleCategoryStatus, loading } = useAppContext();
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');

  const counts = useMemo(() => Object.fromEntries(VIEWS.map(v => [v.id, categories.filter(v.match).length])), [categories]);
  const namesById = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matchesView = VIEWS.find(v => v.id === view).match;
    return categories
      .filter(c => matchesView(c) && (!term || `${c.name} ${c.slug || ''}`.toLowerCase().includes(term)))
      .sort(SORTS[sort].compare);
  }, [categories, view, search, sort]);

  if (loading) return <PageLoader />;

  const handleVisibility = async (category) => {
    const show = category.isActive === false;
    try {
      await toggleCategoryStatus(category.id, show);
      toast.success(show ? `${category.name} is visible on the store` : `${category.name} is hidden from the store`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Visibility could not be changed.'));
    }
  };

  const handleDelete = async (category) => {
    const count = productCount(category);
    const note = count ? ` Its ${count} product${count !== 1 ? 's stay' : ' stays'} in your catalogue.` : '';
    if (!window.confirm(`Delete the "${category.name}" category?${note} This can't be undone.`)) return;
    try {
      await deleteCategory(category.id);
      toast.success('Category deleted');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The category could not be deleted.'));
    }
  };

  const filtersActive = view !== 'all' || search.trim();

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={text}>Categories</h1>
          <p className="text-[13px] mt-0.5" style={subdued}>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} group your products into collections
          </p>
        </div>
        <Link href="/admin/categories/new" className="sp-btn sp-btn-primary self-start sm:self-auto"><Plus size={15} />Add category</Link>
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
            <select value={sort} onChange={e => setSort(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Sort categories">
              {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
            </select>
            <SearchBox value={search} onChange={setSearch} placeholder="Search categories" />
          </div>
        </div>

        {visible.length === 0 ? (
          categories.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Add your first category"
              description="Categories group products into collections customers can browse, like Anti-Aging or Cleansing."
              action={<Link href="/admin/categories/new" className="sp-btn sp-btn-primary"><Plus size={15} />Add category</Link>}
            />
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No categories match these filters"
              description="Try another view or search term."
              action={filtersActive && (
                <button type="button" onClick={() => { setView('all'); setSearch(''); }} className="sp-btn sp-btn-secondary">Clear filters</button>
              )}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="w-[52px]" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map(category => {
                  const status = categoryStatus(category);
                  const count = productCount(category);
                  const parentName = category.parentId ? namesById.get(category.parentId) : null;
                  return (
                    <tr key={category.id} className="cursor-pointer" onClick={() => router.push(`/admin/categories/${category.id}`)}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[280px]">
                          <div className="w-11 h-11 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center" style={{ border: '1px solid var(--sp-border)' }}>
                            {category.imageUrl
                              ? <img src={category.imageUrl} alt="" className="w-full h-full object-cover" />
                              : <FolderOpen size={16} style={subdued} />}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/categories/${category.id}`}
                              onClick={e => e.stopPropagation()}
                              className="block text-[13px] font-semibold truncate max-w-[380px] hover:underline"
                              style={text}
                            >
                              {category.name}
                            </Link>
                            <p className="text-[12px] truncate max-w-[380px]" style={subdued}>
                              /collections/{category.slug}{parentName ? ` · in ${parentName}` : ''}
                            </p>
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
                            <button type="button" className="p-1.5 rounded-md hover:bg-[#ebebeb] cursor-pointer" aria-label={`Actions for ${category.name}`}>
                              <MoreHorizontal size={16} style={secondary} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[180px]">
                            <DropdownMenuItem onClick={() => router.push(`/admin/categories/${category.id}`)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <Pencil size={14} />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/collections/${category.slug}`, '_blank')} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              <ExternalLink size={14} />View on store
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleVisibility(category)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                              {category.isActive === false ? <><Eye size={14} />Show on store</> : <><EyeOff size={14} />Hide from store</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(category)} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
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
            Showing {visible.length} of {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageCategories;
