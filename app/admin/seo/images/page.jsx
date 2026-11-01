'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ImageOff, Loader2, Wand2 } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import PageLoader from '../../../components/PageLoader';
import { apiErrorMessage } from '../../products/_components/productAdmin';
import { secondary, subdued, text } from '../../_components/EditorFields';
import { EmptyState, SearchBox, ViewPill, toolbarSelectStyle } from '../../_components/IndexToolbar';
import { FillButton, SeoTabs } from '../_components/seoUi';
import { writeAltText } from '@/lib/seoWriter';

const KINDS = {
  product: 'Product photos',
  collection: 'Collections',
  brand: 'Brands',
  hero: 'Hero banner',
  homepage: 'Homepage banners',
  campaign: 'Campaign banners',
  journal: 'Journal',
  social: 'Instagram strip',
};

const VIEWS = [
  { id: 'missing', label: 'Missing alt text', test: (img) => !img.alt && !img.defaultAlt },
  { id: 'default', label: 'Using automatic text', test: (img) => !img.alt && !!img.defaultAlt },
  { id: 'done', label: 'Written', test: (img) => !!img.alt },
  { id: 'all', label: 'All', test: () => true },
];

const omit = (obj, key) => {
  const rest = { ...obj };
  delete rest[key];
  return rest;
};

export default function ImageAltTextPage() {
  const { fetchWithAuth } = useAppContext();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState('missing');
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState({});
  const [filled, setFilled] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/admin/seo/images');
      setData(await res.json());
    } catch (e) {
      setLoadError(apiErrorMessage(e, 'Could not load the images.'));
    }
  }, [fetchWithAuth]);
  useEffect(() => { load(); }, [load]);

  const changed = Object.keys(drafts).length;
  useEffect(() => {
    if (!changed) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changed]);

  if (!data && !loadError) return <PageLoader />;

  const images = data?.images || [];
  const ofKind = images.filter(img => kind === 'all' || img.kind === kind);
  const counts = Object.fromEntries(VIEWS.map(v => [v.id, ofKind.filter(v.test).length]));
  const term = search.trim().toLowerCase();
  const visible = ofKind
    .filter(VIEWS.find(v => v.id === view).test)
    .filter(img => !term || `${img.label} ${img.where} ${img.alt}`.toLowerCase().includes(term));
  const kindsPresent = Object.keys(KINDS).filter(k => images.some(img => img.kind === k));

  const valueOf = (img) => (img.key in drafts ? drafts[img.key] : img.alt);
  const setValue = (img, alt) => {
    setDrafts(prev => (alt === img.alt ? omit(prev, img.key) : { ...prev, [img.key]: alt }));
    setFilled(prev => omit(prev, img.key));
  };

  // Writes alt text from what each image is about (lib/seoWriter.js): free, instant, nothing leaves the site
  const fillOne = (img) => {
    setDrafts(prev => ({ ...prev, [img.key]: writeAltText(img) }));
    setFilled(prev => ({ ...prev, [img.key]: true }));
  };
  const todo = visible.filter(img => !valueOf(img));
  const fillAll = () => {
    setDrafts(prev => ({ ...prev, ...Object.fromEntries(todo.map(img => [img.key, writeAltText(img)])) }));
    setFilled(prev => ({ ...prev, ...Object.fromEntries(todo.map(img => [img.key, true])) }));
    toast.success(`Filled in ${todo.length} alt text${todo.length === 1 ? '' : 's'}. Read them, then save.`);
  };

  const save = async () => {
    const byKey = new Map(images.map(img => [img.key, img]));
    const items = Object.entries(drafts).map(([key, alt]) => ({ kind: byKey.get(key)?.kind, ref: byKey.get(key)?.ref, alt })).filter(i => i.kind);
    setSaving(true);
    try {
      await fetchWithAuth('/api/admin/seo/images', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      toast.success(`Saved ${items.length} alt text${items.length === 1 ? '' : 's'}`);
      setDrafts({});
      setFilled({});
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'The alt text could not be saved.'));
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-[1080px] mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight" style={text}>Image alt text</h1>
        <p className="text-[13px] mt-0.5" style={subdued}>
          A short description of each photo. Screen readers read it out, and Google uses it to understand and rank images.
          Fill in writes it from what each photo is about (the product, collection or banner), for free; read it before saving.
        </p>
      </div>
      <SeoTabs current="/admin/seo/images" />

      {loadError ? (
        <div className="sp-card sp-card-pad text-[13px]" style={{ color: '#b42318' }}>{loadError}</div>
      ) : (
        <div className="sp-card overflow-hidden">
          <div className="px-3 py-2 flex flex-col lg:flex-row lg:items-center gap-2" style={{ borderBottom: '1px solid var(--sp-border)' }}>
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" role="group" aria-label="Views">
              {VIEWS.map(v => <ViewPill key={v.id} active={view === v.id} count={counts[v.id]} onClick={() => setView(v.id)}>{v.label}</ViewPill>)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select value={kind} onChange={e => setKind(e.target.value)} className="sp-input cursor-pointer" style={toolbarSelectStyle} aria-label="Where the images are">
                <option value="all">Everywhere</option>
                {kindsPresent.map(k => <option key={k} value={k}>{KINDS[k]}</option>)}
              </select>
              <SearchBox value={search} onChange={setSearch} placeholder="Search images" />
            </div>
          </div>

          <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderBottom: '1px solid var(--sp-border)', background: 'var(--sp-surface-sub)' }}>
            <p className="text-[13px]" style={secondary}>{todo.length ? `${todo.length} listed image${todo.length === 1 ? ' has' : 's have'} no alt text yet.` : 'Every listed image has alt text.'}</p>
            <button type="button" onClick={fillAll} disabled={!todo.length} className="sp-btn sp-btn-primary ml-auto">
              <Wand2 size={14} />Fill in {todo.length || ''}
            </button>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={ImageOff}
              title={view === 'missing' && !term ? 'No image is missing alt text' : 'No images here'}
              description={view === 'missing' && !term ? 'Choose All to read or change any of them.' : 'Try another view, place or search term.'}
            />
          ) : (
            <ul>
              {visible.map((img, index) => {
                const value = valueOf(img);
                return (
                  <li key={img.key} className="px-4 py-3 grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)] items-start" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="block w-[72px] h-[72px] rounded-lg overflow-hidden bg-white" style={{ border: '1px solid var(--sp-border)' }} aria-label={`Open the image for ${img.label}`}>
                      <img src={img.url} alt="" loading="lazy" className={`w-full h-full ${img.kind === 'product' ? 'object-contain p-1' : 'object-cover'}`} />
                    </a>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <Link href={img.editHref} className="text-[13px] font-semibold hover:underline truncate max-w-full" style={text}>{img.label}</Link>
                        <span className="text-[12px]" style={subdued}>{img.where}</span>
                        {filled[img.key] && <span className="sp-badge sp-badge-attention"><Wand2 size={11} />Filled in, not saved</span>}
                        {img.key in drafts && !filled[img.key] && <span className="sp-badge sp-badge-info">Not saved</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={value}
                          onChange={e => setValue(img, e.target.value)}
                          placeholder={img.defaultAlt ? `Automatic: ${img.defaultAlt}` : 'Describe this image'}
                          aria-label={`Alt text for ${img.label}, ${img.where}`}
                          maxLength={250}
                          className="sp-input min-w-0 flex-1"
                        />
                        <FillButton onClick={() => fillOne(img)} />
                      </div>
                      {value.length > 125 && <p className="text-[12px]" style={{ color: '#8a6100' }}>{value.length} characters. Screen readers handle about 125 best.</p>}
                    </div>
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
            <p className="text-[13px] font-medium flex-1" style={text}>{changed} alt text{changed === 1 ? '' : 's'} not saved</p>
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
