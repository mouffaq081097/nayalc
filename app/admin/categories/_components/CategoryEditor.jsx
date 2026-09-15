'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Check, ExternalLink, Loader2, MoreHorizontal, Package, Trash2, X,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { AutoGrowTextarea, Card, Field, FieldMessage, WARNING_COLOR, invalidStyle, secondary, subdued, text } from '../../_components/EditorFields';
import { SearchBox } from '../../_components/IndexToolbar';
import { ImageSlot, Thumb } from '../../_components/ImageSlot';
import { apiErrorMessage, brandName, fmtAed, productStatus, stockState } from '../../products/_components/productAdmin';
import { categoryStatus, isValidSlug, slugify } from './categoryAdmin';

// Every new image is uploaded in the same save request, and Vercel rejects request bodies over 4.5 MB
const UPLOAD_WARNING_BYTES = 4 * 1024 * 1024;

const initialForm = (category) => ({
  name: category?.name || '',
  description: category?.description || '',
  slug: category?.slug || '',
  parentId: category?.parentId ? String(category.parentId) : '',
  isActive: category?.isActive !== false,
});
const initialProductIds = (category) => (category?.products || []).map(p => p.id);
const initialImage = (url) => (url ? { url } : null);

const snapshot = (form, productIds, image, banner) => JSON.stringify({
  form,
  productIds: [...productIds].sort((a, b) => a - b),
  image: image ? image.url || image.file?.name : null,
  banner: banner ? banner.url || banner.file?.name : null,
});

const ProductsCard = ({ allProducts, productLookup, productIds, onChange }) => {
  const [query, setQuery] = useState('');
  const [browsing, setBrowsing] = useState(false);

  const selected = new Set(productIds);
  const assigned = productIds.map(id => productLookup.get(id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  const term = query.trim().toLowerCase();
  const showResults = browsing || term.length > 0;
  const results = showResults
    ? allProducts
      .filter(p => !term || `${p.name} ${brandName(p)}`.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const toggle = (id) => onChange(selected.has(id) ? productIds.filter(x => x !== id) : [...productIds, id]);

  return (
    <Card title="Products" description={`${productIds.length} product${productIds.length !== 1 ? 's' : ''} in this category`}>
      <div className="flex gap-2">
        <SearchBox value={query} onChange={setQuery} placeholder="Search products to add" className="flex-1 min-w-0" />
        <button type="button" onClick={() => setBrowsing(v => !v)} className="sp-btn sp-btn-secondary" style={{ height: 32 }}>
          {browsing ? 'Close' : 'Browse'}
        </button>
      </div>

      {showResults && (
        <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--sp-border)' }}>
          <div className="max-h-72 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-3 py-5 text-[13px] text-center" style={subdued}>No products match &ldquo;{query.trim()}&rdquo;.</p>
            ) : results.map((product, index) => {
              const on = selected.has(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-pressed={on}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f7f7f7] cursor-pointer"
                  style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}
                >
                  <span
                    className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
                    style={on ? { background: 'var(--sp-primary)' } : { border: '1px solid var(--sp-border-strong)', background: '#ffffff' }}
                  >
                    {on && <Check size={11} strokeWidth={3} className="text-white" />}
                  </span>
                  <Thumb url={product.imageUrl} size={32} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium truncate" style={text}>{product.name}</span>
                    <span className="block text-[12px] truncate" style={subdued}>{brandName(product) || '—'}</span>
                  </span>
                  <span className="text-[13px] whitespace-nowrap" style={secondary}>{fmtAed(product.price)}</span>
                </button>
              );
            })}
          </div>
          <p className="px-3 py-2 text-[12px]" style={{ ...subdued, background: 'var(--sp-surface-sub)', borderTop: '1px solid var(--sp-border)' }}>
            Click a product to add it or take it out of this category.
          </p>
        </div>
      )}

      {assigned.length === 0 ? (
        <div className="mt-4 py-8 px-4 flex flex-col items-center text-center rounded-lg" style={{ background: 'var(--sp-surface-sub)' }}>
          <Package size={22} style={subdued} />
          <p className="text-[13px] font-medium mt-2" style={text}>No products in this category yet</p>
          <p className="text-[12px] mt-0.5" style={subdued}>Search or browse above to add products.</p>
        </div>
      ) : (
        <ul className="mt-3">
          {assigned.map((product, index) => {
            const status = productStatus(product);
            const stock = stockState(product.stock_quantity);
            return (
              <li key={product.id} className="flex items-center gap-3 py-2.5" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                <Thumb url={product.imageUrl} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={text}>{product.name}</p>
                  <p className="text-[12px] truncate" style={{ color: stock.color }}>{stock.label}</p>
                </div>
                {status.id !== 'active' && <span className={`sp-badge ${status.cls}`}>{status.label}</span>}
                <span className="hidden sm:inline text-[13px] whitespace-nowrap" style={secondary}>{fmtAed(product.price)}</span>
                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-label={`Remove ${product.name} from this category`}
                  title="Remove from category"
                  className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#f1f1f1] cursor-pointer shrink-0"
                  style={subdued}
                >
                  <X size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default function CategoryEditor({ category, onSaved }) {
  const router = useRouter();
  const { adminCategories, adminProducts, loading, addCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useAppContext();
  const isNew = !category;

  const [form, setForm] = useState(() => initialForm(category));
  const [productIds, setProductIds] = useState(() => initialProductIds(category));
  const [image, setImage] = useState(() => initialImage(category?.imageUrl));
  const [banner, setBanner] = useState(() => initialImage(category?.bannerUrl));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // What the editor looked like when it opened (or was last saved), to detect unsaved changes
  const baselineRef = useRef(null);
  if (baselineRef.current === null) baselineRef.current = snapshot(form, productIds, image, banner);
  const isDirty = snapshot(form, productIds, image, banner) !== baselineRef.current;

  // Free in-memory previews of new images when leaving the page
  const imagesRef = useRef([image, banner]);
  imagesRef.current = [image, banner];
  useEffect(() => () => imagesRef.current.forEach(img => img?.preview && URL.revokeObjectURL(img.preview)), []);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  // Admin products for the picker, plus the category's own product rows in case one is missing from that list
  const productLookup = useMemo(() => {
    const map = new Map((category?.products || []).map(p => [p.id, p]));
    adminProducts.forEach(p => map.set(p.id, p));
    return map;
  }, [adminProducts, category]);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const autoSlug = slugify(form.name);
  const shownSlug = form.slug || autoSlug;

  const validate = () => {
    const found = {};
    if (!form.name.trim()) found.name = 'Add a category name.';
    const slug = form.slug.trim();
    if (!isNew && !slug) found.slug = 'Add a URL handle.';
    else if (slug && !isValidSlug(slug)) found.slug = 'Use lowercase letters, numbers and single hyphens only.';
    else if (slug && adminCategories.some(c => c.slug === slug && c.id !== category?.id)) found.slug = 'Another category already uses this URL handle.';
    return found;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('description', form.description.trim());
    fd.append('slug', form.slug.trim());
    fd.append('parent_id', form.parentId);
    fd.append('product_ids', productIds.join(','));
    if (image?.file) fd.append('image', image.file);
    else fd.append('image_url', image?.url || 'null');
    if (banner?.file) fd.append('banner', banner.file);
    else fd.append('banner_url', banner?.url || 'null');
    return fd;
  };

  const save = async () => {
    if (saving) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted fields.');
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const response = await addCategory(buildFormData());
        const { categoryId } = await response.json();
        if (!form.isActive) await toggleCategoryStatus(categoryId, false);
        baselineRef.current = snapshot(form, productIds, image, banner);
        toast.success('Category created');
        router.replace(`/admin/categories/${categoryId}`);
      } else {
        await updateCategory(category.id, buildFormData());
        if (form.isActive !== (category.isActive !== false)) await toggleCategoryStatus(category.id, form.isActive);
        baselineRef.current = snapshot(form, productIds, image, banner);
        toast.success('Category saved');
        onSaved?.();
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The category could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Cmd/Ctrl+S saves, like the product editor
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const discard = () => {
    if (isDirty && !window.confirm('Discard all unsaved changes?')) return;
    if (isNew) {
      baselineRef.current = snapshot(form, productIds, image, banner);
      router.push('/admin/categories');
      return;
    }
    [image, banner].forEach(img => img?.preview && URL.revokeObjectURL(img.preview));
    setForm(initialForm(category));
    setProductIds(initialProductIds(category));
    setImage(initialImage(category.imageUrl));
    setBanner(initialImage(category.bannerUrl));
    setErrors({});
  };

  const confirmLeave = (e) => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  const handleDelete = async () => {
    const count = initialProductIds(category).length;
    const note = count ? ` Its ${count} product${count !== 1 ? 's stay' : ' stays'} in your catalogue.` : '';
    if (!window.confirm(`Delete the "${category.name}" category?${note} This can't be undone.`)) return;
    try {
      await deleteCategory(category.id);
      baselineRef.current = snapshot(form, productIds, image, banner);
      toast.success('Category deleted');
      router.push('/admin/categories');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The category could not be deleted.'));
    }
  };

  if (loading) return <PageLoader />;

  const headerStatus = categoryStatus(category);
  const assignedProducts = productIds.map(id => productLookup.get(id)).filter(Boolean);
  const liveCount = assignedProducts.filter(p => productStatus(p).id === 'active' && stockState(p.stock_quantity).id !== 'out').length;
  const outOfStockCount = assignedProducts.filter(p => stockState(p.stock_quantity).id === 'out').length;
  const newUploadBytes = (image?.file?.size || 0) + (banner?.file?.size || 0);
  const showSaveBar = isNew || isDirty;

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/admin/categories"
          onClick={confirmLeave}
          aria-label="Back to categories"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
          style={secondary}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[20px] font-semibold truncate min-w-0 max-w-full" style={text}>{isNew ? 'Add category' : category.name}</h1>
        {!isNew && <span className={`sp-badge ${headerStatus.cls}`}>{headerStatus.label}</span>}
        {!isNew && (
          <div className="ml-auto flex items-center gap-2">
            <a href={`/collections/${category.slug}`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
              <ExternalLink size={14} />View on store
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="sp-btn sp-btn-secondary px-2.5" aria-label="More actions"><MoreHorizontal size={16} /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[190px]">
                <DropdownMenuItem onClick={handleDelete} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
                  <Trash2 size={14} />Delete category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); save(); }} noValidate>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">

          {/* ── Main column ── */}
          <div className="space-y-4 min-w-0">
            <Card>
              <div className="space-y-4">
                <Field label="Name" htmlFor="name" error={errors.name}>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. Anti-Aging / Serums"
                    className="sp-input"
                    style={invalidStyle(errors.name)}
                    aria-invalid={!!errors.name}
                  />
                </Field>
                <Field label="Description" htmlFor="description" optional hint="Shown on the category's collection page.">
                  <AutoGrowTextarea id="description" value={form.description} onChange={e => setField('description', e.target.value)} minRows={4} />
                </Field>
              </div>
            </Card>

            <ProductsCard allProducts={adminProducts} productLookup={productLookup} productIds={productIds} onChange={setProductIds} />

            <Card title="Images">
              <div className="space-y-4">
                <div className="max-w-[220px]">
                  <ImageSlot
                    label="Category image"
                    hint="Shown on category cards in the store, like Shop by category on the homepage."
                    aspectClass="aspect-square"
                    value={image}
                    onChange={setImage}
                  />
                </div>
                <ImageSlot
                  label="Banner"
                  hint="Saved with the category for a wide collection header (about 1920 × 600). The store doesn't display category banners yet."
                  aspectClass="aspect-[16/5]"
                  value={banner}
                  onChange={setBanner}
                />
                {newUploadBytes > UPLOAD_WARNING_BYTES && (
                  <FieldMessage color={WARNING_COLOR}>
                    New images add up to {(newUploadBytes / 1024 / 1024).toFixed(1)} MB. Saves over about 4 MB can fail — use smaller files.
                  </FieldMessage>
                )}
              </div>
            </Card>

            <Card title="Search engine listing" description="How this category's collection page can appear in Google results.">
              <Field
                label="URL handle"
                htmlFor="slug"
                error={errors.slug}
                hint={isNew ? 'Leave blank to create it from the name.' : 'Changing it breaks existing links to this category.'}
              >
                <div className="flex items-stretch">
                  <span
                    className="flex items-center px-3 text-[13px] whitespace-nowrap rounded-l-lg"
                    style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border-strong)', borderRight: 0, color: 'var(--sp-text-subdued)' }}
                  >
                    <span className="hidden sm:inline">nayalc.com</span>/collections/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={form.slug}
                    placeholder={autoSlug || 'category-name'}
                    onChange={e => setField('slug', e.target.value)}
                    onBlur={() => form.slug && setField('slug', slugify(form.slug))}
                    className="sp-input min-w-0"
                    style={invalidStyle(errors.slug, { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 })}
                    aria-invalid={!!errors.slug}
                  />
                </div>
              </Field>
              <div className="mt-4 rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)' }}>
                <p className="text-[12px] truncate" style={secondary}>nayalc.com › collections › {shownSlug || '…'}</p>
                <p className="text-[17px] leading-snug mt-0.5 truncate" style={{ color: '#1a0dab' }}>
                  {form.name.trim() || 'Category name'} | Naya Lumière Cosmetics
                </p>
                <p className="text-[13px] mt-1 line-clamp-2" style={secondary}>
                  {(form.description.trim() || 'Your description appears here.').slice(0, 160)}
                </p>
              </div>
            </Card>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-4 lg:sticky lg:top-0">
            <Card title="Visibility">
              <select
                id="visibility"
                value={form.isActive ? 'visible' : 'hidden'}
                onChange={e => setField('isActive', e.target.value === 'visible')}
                className="sp-input cursor-pointer"
                aria-label="Visibility"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <p className="text-[12px] mt-2" style={subdued}>
                {form.isActive
                  ? "Listed with the store's categories, and its collection page is live."
                  : "Hidden from the store — it isn't listed and its collection page isn't available."}
              </p>
            </Card>

            <Card title="Organization">
              <Field
                label="Parent category"
                htmlFor="parentId"
                optional
                hint="Groups this category under another one here in the admin. The store doesn't show nested categories yet."
              >
                <select id="parentId" value={form.parentId} onChange={e => setField('parentId', e.target.value)} className="sp-input cursor-pointer">
                  <option value="">None — top level</option>
                  {adminCategories.filter(c => c.id !== category?.id).map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </Card>

            <Card title="Summary">
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between gap-3"><dt style={secondary}>Products</dt><dd className="font-medium" style={text}>{productIds.length}</dd></div>
                <div className="flex justify-between gap-3"><dt style={secondary}>Available to buy</dt><dd className="font-medium" style={text}>{liveCount}</dd></div>
                <div className="flex justify-between gap-3">
                  <dt style={secondary}>Out of stock</dt>
                  <dd className="font-medium" style={{ color: outOfStockCount ? '#b42318' : 'var(--sp-text)' }}>{outOfStockCount}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>

        {/* Save bar — always shown for a new category, and for an existing one once something changes */}
        {showSaveBar && (
          <div className="sticky bottom-4 z-20 mt-4">
            <div className="sp-card flex items-center gap-3 px-4 py-3" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <p className="text-[13px] font-medium flex-1" style={text}>
                {isNew ? 'New category' : 'Unsaved changes'}
                <span className="hidden sm:inline font-normal ml-2" style={subdued}>Press ⌘S / Ctrl+S to save</span>
              </p>
              <button type="button" onClick={discard} disabled={saving} className="sp-btn sp-btn-secondary">Discard</button>
              <button type="submit" disabled={saving} className="sp-btn sp-btn-primary min-w-[120px]">
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : isNew ? 'Save category' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
