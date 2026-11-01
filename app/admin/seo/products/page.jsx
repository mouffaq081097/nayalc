'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ChevronDown, ExternalLink, Loader2, Package, Undo2, Wand2 } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import PageLoader from '../../../components/PageLoader';
import { apiErrorMessage } from '../../products/_components/productAdmin';
import { AutoGrowTextarea, secondary, subdued, text } from '../../_components/EditorFields';
import { EmptyState, SearchBox, ViewPill } from '../../_components/IndexToolbar';
import { autoSeoDescription, autoSeoTitle, productTitle, SEO_DESCRIPTION_LIMIT, SEO_TITLE_LIMIT } from '@/lib/seo';
import { resolveGoogleCategory, sourceLabel } from '@/lib/googleTaxonomy';
import { CharCount, FillButton, GoogleCategorySelect, SeoTabs, SerpPreview, categoryLabel } from '../_components/seoUi';
import { writeAltText, writeSeoDescription, writeSeoTitle } from '@/lib/seoWriter';

const VIEWS = [
  { id: 'todo', label: 'Needs text', test: (p) => p.visible && (!p.seoTitle || !p.seoDescription) },
  { id: 'alts', label: 'Photos without alt text', test: (p) => p.images.some(i => !i.alt) },
  { id: 'live', label: 'Live', test: (p) => p.visible },
  { id: 'all', label: 'All', test: () => true },
];

const omit = (obj, key) => {
  const rest = { ...obj };
  delete rest[key];
  return rest;
};

const altContext = (p, index) => ({
  kind: 'product',
  label: `${productTitle(p.name, p.brand)}${p.size ? `, ${p.size}` : ''}`,
  detail: `photo ${index + 1} of ${p.images.length}`,
});

export default function ProductListingsPage() {
  const { fetchWithAuth } = useAppContext();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState('todo');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [drafts, setDrafts] = useState({});
  const [filled, setFilled] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/admin/seo/products');
      setData(await res.json());
    } catch (e) {
      setLoadError(apiErrorMessage(e, 'Could not load the products.'));
    }
  }, [fetchWithAuth]);
  useEffect(() => { load(); }, [load]);

  const byId = useMemo(() => new Map((data?.categories || []).map(c => [Number(c.id), c])), [data]);
  const automaticCategory = useCallback(
    (p) => resolveGoogleCategory({ ...p, google_category_id: null }, p.categoryIds.map(id => byId.get(id)).filter(Boolean), byId),
    [byId],
  );

  const changed = Object.keys(drafts).length;
  useEffect(() => {
    if (!changed) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changed]);

  if (!data && !loadError) return <PageLoader />;

  const products = data?.products || [];
  const counts = Object.fromEntries(VIEWS.map(v => [v.id, products.filter(v.test).length]));
  const term = search.trim().toLowerCase();
  const visible = products
    .filter(VIEWS.find(v => v.id === view).test)
    .filter(p => !term || `${p.name} ${p.brand || ''}`.toLowerCase().includes(term));

  // What a product shows now: the unsaved draft over what's saved
  const draftOf = (p) => drafts[p.id] || {};
  const valueOf = (p, field) => (field in draftOf(p) ? draftOf(p)[field] : p[field]);
  const altOf = (p, img) => (draftOf(p).alts && img.id in draftOf(p).alts ? draftOf(p).alts[img.id] : img.alt);

  const setDraft = (p, patch) => setDrafts(prev => ({ ...prev, [p.id]: { ...prev[p.id], ...patch } }));
  const setDraftAlt = (p, imageId, alt) => setDrafts(prev => ({ ...prev, [p.id]: { ...prev[p.id], alts: { ...prev[p.id]?.alts, [imageId]: alt } } }));
  const revert = (p) => {
    setDrafts(prev => omit(prev, p.id));
    setFilled(prev => omit(prev, p.id));
  };

  // Writes the title, description and missing alt text from the product's own details (lib/seoWriter.js).
  // `keepWritten` leaves text that's already there alone, for filling many products at once.
  const fillPatch = (p, { keepWritten }) => {
    const patch = {};
    if (!keepWritten || !valueOf(p, 'seoTitle')) patch.seoTitle = writeSeoTitle(p);
    if (!keepWritten || !valueOf(p, 'seoDescription')) patch.seoDescription = writeSeoDescription(p);
    const alts = {};
    p.images.forEach((img, i) => { if (!altOf(p, img)) alts[img.id] = writeAltText(altContext(p, i)); });
    if (Object.keys(alts).length) patch.alts = { ...draftOf(p).alts, ...alts };
    return patch;
  };
  const fillOne = (p) => {
    setDraft(p, fillPatch(p, { keepWritten: false }));
    setFilled(prev => ({ ...prev, [p.id]: true }));
  };
  const fillSelected = () => {
    const list = products.filter(p => selected.has(p.id));
    let count = 0;
    const patches = {};
    list.forEach((p) => {
      const patch = fillPatch(p, { keepWritten: true });
      if (Object.keys(patch).length) {
        patches[p.id] = patch;
        count += 1;
      }
    });
    setDrafts(prev => {
      const next = { ...prev };
      Object.entries(patches).forEach(([id, patch]) => { next[id] = { ...next[id], ...patch }; });
      return next;
    });
    setFilled(prev => ({ ...prev, ...Object.fromEntries(Object.keys(patches).map(id => [id, true])) }));
    toast.success(count
      ? `Filled in ${count} product${count === 1 ? '' : 's'}. Read them, then save.`
      : 'Those products already have their own text.');
  };

  const save = async () => {
    const items = Object.entries(drafts).map(([id, d]) => ({
      id: Number(id),
      ...('seoTitle' in d ? { seoTitle: d.seoTitle } : {}),
      ...('seoDescription' in d ? { seoDescription: d.seoDescription } : {}),
      ...('googleCategoryId' in d ? { googleCategoryId: d.googleCategoryId } : {}),
      imageAlts: Object.entries(d.alts || {}).map(([imageId, alt]) => ({ imageId: Number(imageId), alt })),
    }));
    setSaving(true);
    try {
      await fetchWithAuth('/api/admin/seo/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      toast.success(`Saved ${items.length} product${items.length === 1 ? '' : 's'}`);
      setDrafts({});
      setFilled({});
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The changes could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const allSelected = visible.length > 0 && visible.every(p => selected.has(p.id));
  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev);
    visible.forEach(p => (allSelected ? next.delete(p.id) : next.add(p.id)));
    return next;
  });
  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="max-w-[1080px] mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight" style={text}>Product listings</h1>
        <p className="text-[13px] mt-0.5" style={subdued}>The title and description Google shows for each product page, its Google product category, and its photos&apos; alt text.</p>
      </div>
      <SeoTabs current="/admin/seo/products" />

      {loadError ? (
        <div className="sp-card sp-card-pad text-[13px]" style={{ color: '#b42318' }}>{loadError}</div>
      ) : (
        <div className="sp-card overflow-hidden">
          <div className="px-3 py-2 flex flex-col lg:flex-row lg:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
              {VIEWS.map(v => <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>)}
            </div>
            <SearchBox value={search} onChange={setSearch} placeholder="Search products" />
          </div>

          {/* Fill in many at once */}
          <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderBottom: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={secondary}>
              <input type="checkbox" className="sp-check" checked={allSelected} onChange={toggleAll} disabled={!visible.length} />
              {selected.size ? `${selected.size} selected` : 'Select all'}
            </label>
            <p className="text-[12px] flex-1 min-w-[200px]" style={subdued}>
              Fill in writes the empty titles, descriptions and alt text from each product&apos;s own details. Free, nothing leaves the site, and nothing is saved until you press Save.
            </p>
            <button type="button" onClick={fillSelected} disabled={!selected.size} className="sp-btn sp-btn-primary">
              <Wand2 size={14} />Fill in{selected.size ? ` (${selected.size})` : ''}
            </button>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Package}
              title={view === 'todo' && !term ? 'Every live product has its own title and description' : 'No products here'}
              description={view === 'todo' && !term ? 'Choose All to read or change them.' : 'Try another view or search term.'}
            />
          ) : (
            <ul>
              {visible.map((p, index) => {
                const title = valueOf(p, 'seoTitle');
                const description = valueOf(p, 'seoDescription');
                const own = valueOf(p, 'googleCategoryId');
                const auto = automaticCategory(p);
                const resolved = own ? { id: own, source: 'product' } : auto;
                const missingAlts = p.images.filter(img => !altOf(p, img)).length;
                const isOpen = open === p.id;
                const dirty = !!drafts[p.id];
                const autoTitle = autoSeoTitle(p);
                const autoDescription = autoSeoDescription(p);
                return (
                  <li key={p.id} style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa]">
                      <input type="checkbox" className="sp-check shrink-0" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} />
                      <button type="button" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
                        <span className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center" style={{ border: '1px solid var(--sp-border)' }}>
                          {p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={15} style={subdued} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold truncate" style={text}>{p.name}</span>
                          <span className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`sp-badge ${title ? 'sp-badge-success' : 'sp-badge-neutral'}`}>{title ? 'Own title' : 'Automatic title'}</span>
                            <span className={`sp-badge ${description ? 'sp-badge-success' : 'sp-badge-neutral'}`}>{description ? 'Own description' : 'Automatic description'}</span>
                            {missingAlts > 0 && <span className="sp-badge sp-badge-warning">{missingAlts} photo{missingAlts === 1 ? '' : 's'} without alt text</span>}
                            {!p.visible && <span className="sp-badge sp-badge-neutral">Hidden</span>}
                            {filled[p.id] && <span className="sp-badge sp-badge-attention"><Wand2 size={11} />Filled in, not saved</span>}
                            {dirty && !filled[p.id] && <span className="sp-badge sp-badge-info">Not saved</span>}
                          </span>
                        </span>
                        <span className="hidden md:block w-[210px] shrink-0 text-[12px] truncate" style={secondary} title={`${categoryLabel(resolved.id)} · ${sourceLabel(resolved)}`}>
                          {categoryLabel(resolved.id)}
                        </span>
                        <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={subdued} />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-4 pb-5 pt-1 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" style={{ background: '#fcfcfc' }}>
                        <div className="space-y-4 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <FillButton onClick={() => fillOne(p)} title="Write the title, description and missing alt text from this product's details" />
                            {dirty && <button type="button" onClick={() => revert(p)} className="sp-btn sp-btn-plain"><Undo2 size={13} />Undo changes</button>}
                            <Link href={`/admin/products/${p.id}`} className="sp-btn sp-btn-plain ml-auto">Edit product</Link>
                            <a href={`/product/${p.slug || p.id}`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-plain"><ExternalLink size={13} />View</a>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label htmlFor={`t-${p.id}`} className="text-[13px] font-medium" style={secondary}>Page title</label>
                              <CharCount value={title || autoTitle} limit={SEO_TITLE_LIMIT} />
                            </div>
                            <input id={`t-${p.id}`} type="text" value={title} onChange={e => setDraft(p, { seoTitle: e.target.value })} placeholder={autoTitle} className="sp-input" maxLength={120} />
                            <p className="text-[12px] mt-1.5" style={subdued}>Left empty, the page uses the automatic title shown in grey.</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label htmlFor={`d-${p.id}`} className="text-[13px] font-medium" style={secondary}>Meta description</label>
                              <CharCount value={description || autoDescription} limit={SEO_DESCRIPTION_LIMIT} />
                            </div>
                            <AutoGrowTextarea id={`d-${p.id}`} value={description} onChange={e => setDraft(p, { seoDescription: e.target.value })} placeholder={autoDescription} minRows={2} maxLength={320} />
                          </div>
                          <div>
                            <label htmlFor={`g-${p.id}`} className="block text-[13px] font-medium mb-1.5" style={secondary}>Google product category</label>
                            <GoogleCategorySelect id={`g-${p.id}`} value={own} onChange={v => setDraft(p, { googleCategoryId: v })} autoLabel={`Automatic: ${categoryLabel(auto.id)} (${sourceLabel(auto).toLowerCase()})`} />
                          </div>
                          {p.images.length > 0 && (
                            <div>
                              <p className="text-[13px] font-medium mb-2" style={secondary}>Photo alt text</p>
                              <ul className="space-y-2">
                                {p.images.map((img, i) => (
                                  <PhotoAlt key={img.id} img={img} value={altOf(p, img)} onChange={alt => setDraftAlt(p, img.id, alt)} context={altContext(p, i)} />
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-[12px] font-semibold uppercase tracking-wide" style={subdued}>Google preview</p>
                          <SerpPreview path={`product › ${p.slug || p.id}`} title={title || autoTitle} description={description || autoDescription} />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {changed > 0 && (
        <div className="sticky bottom-4 z-20">
          <div className="sp-card flex items-center gap-3 px-4 py-3" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <p className="text-[13px] font-medium flex-1" style={text}>{changed} product{changed === 1 ? '' : 's'} with unsaved changes</p>
            <button type="button" onClick={() => { setDrafts({}); setFilled({}); }} disabled={saving} className="sp-btn sp-btn-secondary">Discard</button>
            <button type="button" onClick={save} disabled={saving} className="sp-btn sp-btn-primary min-w-[96px]">
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoAlt({ img, value, onChange, context }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-10 h-10 rounded-md shrink-0 overflow-hidden bg-white" style={{ border: '1px solid var(--sp-border)' }}>
        <img src={img.url} alt="" className="w-full h-full object-contain p-0.5" />
      </span>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={img.isMain ? 'Main photo: describe it' : 'Describe this photo'} aria-label={`Alt text for ${context.detail}`} className="sp-input min-w-0 flex-1" maxLength={250} />
      <FillButton onClick={() => onChange(writeAltText(context))} title="Write it from the product's name and size" />
    </li>
  );
}
