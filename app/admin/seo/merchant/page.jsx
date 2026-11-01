'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Check, Copy, ExternalLink, Loader2, Package, Wand2 } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import PageLoader from '../../../components/PageLoader';
import { apiErrorMessage } from '../../products/_components/productAdmin';
import { Card, secondary, subdued, text } from '../../_components/EditorFields';
import { EmptyState, SearchBox, ViewPill } from '../../_components/IndexToolbar';
import { collectionGoogleCategory, collectionPath, sourceLabel, suggestGoogleCategory } from '@/lib/googleTaxonomy';
import { GoogleCategorySelect, SeoTabs, categoryLabel } from '../_components/seoUi';

const VIEWS = [
  { id: 'issues', label: 'Needs a look', test: (i) => (i.included && (i.issues.length || i.category.source === 'brand')) || (!i.included && !i.reasons.includes('Hidden or draft')) },
  { id: 'in', label: 'In the feed', test: (i) => i.included },
  { id: 'out', label: 'Left out', test: (i) => !i.included },
];

const SOURCE_BADGE = { product: 'sp-badge-info', name: 'sp-badge-success', collection: 'sp-badge-success', brand: 'sp-badge-warning' };

export default function GoogleMerchantPage() {
  const { fetchWithAuth } = useAppContext();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('issues');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/admin/seo/merchant');
      setData(await res.json());
    } catch (e) {
      setLoadError(apiErrorMessage(e, 'Could not check the feed.'));
    }
  }, [fetchWithAuth]);
  useEffect(() => { load(); }, [load]);

  const byId = useMemo(() => new Map((data?.categories || []).map(c => [Number(c.id), c])), [data]);

  if (!data && !loadError) return <PageLoader />;
  if (loadError) {
    return (
      <div className="max-w-[1080px] mx-auto space-y-4">
        <h1 className="text-[20px] font-semibold" style={text}>Google Merchant</h1>
        <SeoTabs current="/admin/seo/merchant" />
        <div className="sp-card sp-card-pad text-[13px]" style={{ color: '#b42318' }}>{loadError}</div>
      </div>
    );
  }

  const { items, categories, feedUrl } = data;
  const inFeed = items.filter(i => i.included);
  const counts = Object.fromEntries(VIEWS.map(v => [v.id, items.filter(v.test).length]));
  const term = search.trim().toLowerCase();
  const visible = items.filter(VIEWS.find(v => v.id === view).test).filter(i => !term || `${i.name} ${i.brand || ''}`.toLowerCase().includes(term));

  const valueOf = (c) => (c.id in drafts ? drafts[c.id] : c.googleCategoryId);
  const inheritedOf = (c) => {
    const parent = c.parentId ? byId.get(Number(c.parentId)) : null;
    return parent ? collectionGoogleCategory(parent, byId) : null;
  };
  // Unset collections whose name clearly says what they hold, when that changes anything
  const suggestionFor = (c) => {
    const id = !valueOf(c) ? suggestGoogleCategory(c.name) : null;
    return id && id !== inheritedOf(c) ? id : null;
  };
  const suggestions = categories.map(c => ({ c, id: suggestionFor(c) })).filter(s => s.id);
  const changed = Object.keys(drafts).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.info(feedUrl);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const collections = Object.entries(drafts).map(([id, googleCategoryId]) => ({ id: Number(id), googleCategoryId }));
      await fetchWithAuth('/api/admin/seo/merchant', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collections }) });
      toast.success(`Saved ${collections.length} collection${collections.length === 1 ? '' : 's'}. The feed picks it up within the hour.`);
      setDrafts({});
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The categories could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight" style={text}>Google Merchant</h1>
        <p className="text-[13px] mt-0.5" style={subdued}>What Google Shopping and free product listings receive from your product feed, and the Google category each product goes under.</p>
      </div>
      <SeoTabs current="/admin/seo/merchant" />

      <Card title="Product feed" description="Merchant Center reads this address once a day: Products → Feeds → Add a scheduled fetch.">
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="text" readOnly value={feedUrl} onFocus={e => e.target.select()} aria-label="Feed address" className="sp-input min-w-0 flex-1 font-mono text-[12.5px]" />
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="sp-btn sp-btn-secondary">{copied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy</>}</button>
            <a href={feedUrl} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary"><ExternalLink size={14} />Open</a>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['In the feed', inFeed.length],
            ['Left out', items.length - inFeed.length],
            ['With a warning', inFeed.filter(i => i.issues.length).length],
            ['On the brand default category', inFeed.filter(i => i.category.source === 'brand').length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg px-3 py-2" style={{ background: 'var(--sp-surface-sub)' }}>
              <dt className="text-[12px]" style={subdued}>{label}</dt>
              <dd className="text-[18px] font-semibold tabular-nums" style={text}>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[12px] mt-3" style={subdued}>
          Barcodes (GTIN) aren&apos;t stored yet, so every product goes out as having none. Google may still ask for them for GERnétic and Zorah.
        </p>
      </Card>

      <Card
        title="Collections and Google categories"
        description="Each product goes under the most precise category its own name and its collections agree on. Set a collection to tell Google what all its products are; a collection that isn't set uses its parent's."
        action={suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setDrafts(prev => ({ ...prev, ...Object.fromEntries(suggestions.map(s => [s.c.id, s.id])) }))}
            className="sp-btn sp-btn-secondary shrink-0"
          >
            <Wand2 size={14} />Use {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
          </button>
        )}
      >
        {categories.length === 0 ? (
          <p className="text-[13px]" style={subdued}>No collections yet.</p>
        ) : (
          <ul className="-mx-5">
            {categories.map((c, index) => {
              const value = valueOf(c);
              const parent = c.parentId ? byId.get(Number(c.parentId)) : null;
              const inherited = inheritedOf(c);
              const suggested = suggestionFor(c);
              return (
                <li key={c.id} className="px-5 py-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)] md:items-center" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                  <div className="min-w-0">
                    <Link href={`/admin/categories/${c.id}`} className="text-[13px] font-semibold hover:underline" style={text}>{collectionPath(c, byId)}</Link>
                    <p className="text-[12px]" style={subdued}>
                      {c.productCount} product{c.productCount === 1 ? '' : 's'}
                      {c.isActive === false ? ' · hidden' : ''}
                      {c.id in drafts ? ' · not saved' : ''}
                    </p>
                  </div>
                  <div>
                    <GoogleCategorySelect
                      id={`gc-${c.id}`}
                      value={value}
                      onChange={v => setDrafts(prev => {
                        const next = { ...prev, [c.id]: v };
                        if ((v || null) === (c.googleCategoryId || null)) delete next[c.id];
                        return next;
                      })}
                      autoLabel={inherited ? `Same as ${parent.name}: ${categoryLabel(inherited)}` : 'Not set: each product goes by its name'}
                    />
                    {suggested && (
                      <button type="button" onClick={() => setDrafts(prev => ({ ...prev, [c.id]: suggested }))} className="mt-1 text-[12px] sp-link cursor-pointer">
                        Use the suggestion: {categoryLabel(suggested)}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="sp-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="sp-section-title">Products in the feed</h2>
          <p className="text-[12px] mt-0.5" style={subdued}>Exactly what Google receives. Change a product&apos;s own category in its editor, or in Product listings.</p>
        </div>
        <div className="px-3 py-2 flex flex-col lg:flex-row lg:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)', borderTop: '1px solid var(--sp-border)' }}>
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
            {VIEWS.map(v => <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>)}
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search products" />
        </div>
        {visible.length === 0 ? (
          <EmptyState icon={Package} title={view === 'issues' ? 'Nothing needs a look' : 'No products here'} description={view === 'issues' ? 'Every product in the feed has a precise category and no warnings.' : 'Try another view or search term.'} />
        ) : (
          <ul>
            {visible.map((item, index) => (
              <li key={item.id} className="px-4 py-3 flex items-start gap-3" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                <span className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-white flex items-center justify-center" style={{ border: '1px solid var(--sp-border)' }}>
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain p-0.5" /> : <Package size={15} style={subdued} />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${item.id}`} className="block text-[13px] font-semibold truncate hover:underline" style={text}>{item.title}</Link>
                  <p className="text-[12px] mt-0.5" style={secondary}>
                    {categoryLabel(item.category.id)}
                    <span className={`sp-badge ${SOURCE_BADGE[item.category.source]} ml-2 align-middle`}>{sourceLabel(item.category)}</span>
                  </p>
                  {item.productType && <p className="text-[12px] mt-0.5" style={subdued}>Product type: {item.productType}</p>}
                  {(item.reasons.length > 0 || item.issues.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.reasons.map(r => <span key={r} className="sp-badge sp-badge-critical">Left out: {r.toLowerCase()}</span>)}
                      {item.issues.map(r => <span key={r} className="sp-badge sp-badge-warning">{r}</span>)}
                    </div>
                  )}
                </div>
                <span className="text-[12px] whitespace-nowrap capitalize" style={subdued}>{item.availability.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {changed > 0 && (
        <div className="sticky bottom-4 z-20">
          <div className="sp-card flex items-center gap-3 px-4 py-3" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <p className="text-[13px] font-medium flex-1" style={text}>{changed} collection{changed === 1 ? '' : 's'} changed</p>
            <button type="button" onClick={() => setDrafts({})} disabled={saving} className="sp-btn sp-btn-secondary">Discard</button>
            <button type="button" onClick={save} disabled={saving} className="sp-btn sp-btn-primary min-w-[96px]">
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
