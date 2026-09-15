'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, ExternalLink, Loader2, MoreHorizontal, Package, Trash2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { slugify } from '@/lib/slugify';
import { Card, Field, FieldMessage, WARNING_COLOR, invalidStyle, secondary, subdued, text } from '../../_components/EditorFields';
import { ImageSlot, Thumb } from '../../_components/ImageSlot';
import { apiErrorMessage, fmtAed, productStatus, stockState } from '../../products/_components/productAdmin';
import { brandStatus } from './brandAdmin';

const initialForm = (brand) => ({ name: brand?.name || '', isActive: brand?.is_active !== false });
const initialImage = (brand) => (brand?.imageurl ? { url: brand.imageurl } : null);
const snapshot = (form, image) => JSON.stringify({ form, image: image ? image.url || image.file?.name : null });

export default function BrandEditor({ brand, onSaved }) {
  const router = useRouter();
  const { adminBrands, adminProducts, loading, addBrand, updateBrand, deleteBrand, toggleBrandStatus } = useAppContext();
  const isNew = !brand;

  const [form, setForm] = useState(() => initialForm(brand));
  const [image, setImage] = useState(() => initialImage(brand));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // What the editor looked like when it opened (or was last saved), to detect unsaved changes
  const baselineRef = useRef(null);
  if (baselineRef.current === null) baselineRef.current = snapshot(form, image);
  const isDirty = snapshot(form, image) !== baselineRef.current;

  // Free the in-memory preview of a new photo when leaving the page
  const imageRef = useRef(image);
  imageRef.current = image;
  useEffect(() => () => imageRef.current?.preview && URL.revokeObjectURL(imageRef.current.preview), []);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  // A product's brand is set on the product itself, so this list is read-only
  const products = useMemo(() => (isNew ? [] : adminProducts
    .filter(p => String(p.brand_id) === String(brand.id))
    .sort((a, b) => a.name.localeCompare(b.name))), [adminProducts, brand, isNew]);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const slug = slugify(form.name);
  const savedSlug = brand ? slugify(brand.name) : '';
  const addressChanges = !isNew && slug && slug !== savedSlug;

  const validate = () => {
    const found = {};
    if (!form.name.trim()) found.name = 'Add a brand name.';
    else if (adminBrands.some(b => b.id !== brand?.id && slugify(b.name) === slug)) {
      found.name = 'Another brand already uses this name.';
    }
    return found;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name.trim());
    if (image?.file) fd.append('image', image.file);
    else fd.append('image_url', image?.url || 'null');
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
        const response = await addBrand(buildFormData());
        const { brand: created } = await response.json();
        if (!form.isActive) await toggleBrandStatus(created.id, false);
        baselineRef.current = snapshot(form, image);
        toast.success('Brand created');
        router.replace(`/admin/brands/${created.id}`);
      } else {
        await updateBrand(brand.id, buildFormData());
        if (form.isActive !== (brand.is_active !== false)) await toggleBrandStatus(brand.id, form.isActive);
        baselineRef.current = snapshot(form, image);
        toast.success('Brand saved');
        onSaved?.();
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The brand could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Cmd/Ctrl+S saves, like the other editors
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
      baselineRef.current = snapshot(form, image);
      router.push('/admin/brands');
      return;
    }
    if (image?.preview) URL.revokeObjectURL(image.preview);
    setForm(initialForm(brand));
    setImage(initialImage(brand));
    setErrors({});
  };

  const confirmLeave = (e) => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  const handleDelete = async () => {
    if (products.length > 0) {
      toast.error(`${brand.name} still has ${products.length} product${products.length !== 1 ? 's' : ''}. Move them to another brand first, or hide the brand instead.`);
      return;
    }
    if (!window.confirm(`Delete the "${brand.name}" brand? This can't be undone.`)) return;
    try {
      await deleteBrand(brand.id);
      baselineRef.current = snapshot(form, image);
      toast.success('Brand deleted');
      router.push('/admin/brands');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The brand could not be deleted.'));
    }
  };

  if (loading) return <PageLoader />;

  const headerStatus = brandStatus(brand);
  const liveCount = products.filter(p => productStatus(p).id === 'active' && stockState(p.stock_quantity).id !== 'out').length;
  const outOfStockCount = products.filter(p => stockState(p.stock_quantity).id === 'out').length;
  const showSaveBar = isNew || isDirty;
  const pageTitle = `Shop ${form.name.trim() || 'Brand name'} | Premium Beauty & Skincare | nayalc.com UAE`;
  const pageDescription = `Discover the exquisite range of products from ${form.name.trim() || 'this brand'}. Shop authentic ${form.name.trim() || 'brand'} beauty and skincare essentials at nayalc.com. Fast delivery in the UAE.`;

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/admin/brands"
          onClick={confirmLeave}
          aria-label="Back to brands"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
          style={secondary}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[20px] font-semibold truncate min-w-0 max-w-full" style={text}>{isNew ? 'Add brand' : brand.name}</h1>
        {!isNew && <span className={`sp-badge ${headerStatus.cls}`}>{headerStatus.label}</span>}
        {!isNew && (
          <div className="ml-auto flex items-center gap-2">
            <a href={`/brand/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
              <ExternalLink size={14} />View on store
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="sp-btn sp-btn-secondary px-2.5" aria-label="More actions"><MoreHorizontal size={16} /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[180px]">
                <DropdownMenuItem onClick={handleDelete} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
                  <Trash2 size={14} />Delete brand
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
              <Field label="Name" htmlFor="name" error={errors.name} hint="Shown on the brand's page, on product cards and in filters.">
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. GERnétic International"
                  className="sp-input"
                  style={invalidStyle(errors.name)}
                  aria-invalid={!!errors.name}
                />
              </Field>
            </Card>

            <Card title="Brand photo">
              <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)] items-start">
                <ImageSlot label="Photo" aspectClass="aspect-square" value={image} onChange={setImage} />
                <div className="text-[13px] space-y-2 sm:pt-6" style={secondary}>
                  <p>Used for this house on the homepage&apos;s &ldquo;Our three houses&rdquo; section, next to the brand on the Brands page, and when the brand page is shared.</p>
                  <p style={subdued}>Without a photo, the homepage shows the brand&apos;s best-rated product instead.</p>
                </div>
              </div>
            </Card>

            <Card
              title="Products"
              description={isNew
                ? 'Save the brand first, then choose it on each product page.'
                : `${products.length} product${products.length !== 1 ? 's' : ''} from this brand. To change a product's brand, open the product.`}
            >
              {products.length === 0 ? (
                <div className="py-8 px-4 flex flex-col items-center text-center rounded-lg" style={{ background: 'var(--sp-surface-sub)' }}>
                  <Package size={22} style={subdued} />
                  <p className="text-[13px] font-medium mt-2" style={text}>No products from this brand yet</p>
                  <p className="text-[12px] mt-0.5" style={subdued}>Choose this brand in a product&apos;s Organization section.</p>
                </div>
              ) : (
                <ul>
                  {products.map((product, index) => {
                    const status = productStatus(product);
                    const stock = stockState(product.stock_quantity);
                    return (
                      <li key={product.id} style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                        <Link
                          href={`/admin/products/${product.id}`}
                          onClick={confirmLeave}
                          className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-[#f7f7f7] transition-colors"
                        >
                          <Thumb url={product.imageUrl} size={40} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate" style={text}>{product.name}</p>
                            <p className="text-[12px] truncate" style={{ color: stock.color }}>{stock.label}</p>
                          </div>
                          {status.id !== 'active' && <span className={`sp-badge ${status.cls}`}>{status.label}</span>}
                          <span className="text-[13px] whitespace-nowrap" style={secondary}>{fmtAed(product.price)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Search engine listing" description="How this brand's page can appear in Google results.">
              <p className="text-[13px] font-medium mb-1.5" style={secondary}>Web address</p>
              <p className="sp-input truncate" style={{ background: 'var(--sp-surface-sub)', color: 'var(--sp-text-secondary)' }}>
                nayalc.com/brand/{slug || '…'}
              </p>
              {addressChanges
                ? <FieldMessage color={WARNING_COLOR}>Renaming changes the address — links to /brand/{savedSlug} will stop working.</FieldMessage>
                : <p className="text-[12px] mt-1.5" style={subdued}>Created from the brand name.</p>}
              <div className="mt-4 rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)' }}>
                <p className="text-[12px] truncate" style={secondary}>nayalc.com › brand › {slug || '…'}</p>
                <p className="text-[17px] leading-snug mt-0.5 truncate" style={{ color: '#1a0dab' }}>{pageTitle}</p>
                <p className="text-[13px] mt-1 line-clamp-2" style={secondary}>{pageDescription.slice(0, 160)}</p>
              </div>
            </Card>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-4 lg:sticky lg:top-0">
            <Card title="Visibility">
              <select
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
                  ? "Listed with the store's brands, and its brand page is live."
                  : "Hidden from the store — it isn't listed and its brand page isn't available."}
              </p>
            </Card>

            {!isNew && (
              <Card title="Summary">
                <dl className="space-y-2 text-[13px]">
                  <div className="flex justify-between gap-3"><dt style={secondary}>Products</dt><dd className="font-medium" style={text}>{products.length}</dd></div>
                  <div className="flex justify-between gap-3"><dt style={secondary}>Available to buy</dt><dd className="font-medium" style={text}>{liveCount}</dd></div>
                  <div className="flex justify-between gap-3">
                    <dt style={secondary}>Out of stock</dt>
                    <dd className="font-medium" style={{ color: outOfStockCount ? '#b42318' : 'var(--sp-text)' }}>{outOfStockCount}</dd>
                  </div>
                </dl>
              </Card>
            )}
          </div>
        </div>

        {/* Save bar — always shown for a new brand, and for an existing one once something changes */}
        {showSaveBar && (
          <div className="sticky bottom-4 z-20 mt-4">
            <div className="sp-card flex items-center gap-3 px-4 py-3" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <p className="text-[13px] font-medium flex-1" style={text}>
                {isNew ? 'New brand' : 'Unsaved changes'}
                <span className="hidden sm:inline font-normal ml-2" style={subdued}>Press ⌘S / Ctrl+S to save</span>
              </p>
              <button type="button" onClick={discard} disabled={saving} className="sp-btn sp-btn-secondary">Discard</button>
              <button type="submit" disabled={saving} className="sp-btn sp-btn-primary min-w-[110px]">
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : isNew ? 'Save brand' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
