'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowLeft, ExternalLink, Eye, EyeOff, ImagePlus, Loader2, MoreHorizontal, Star, Trash2, Video,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { apiErrorMessage, fmtAed, productStatus, stockState } from './productAdmin';
import { VAT_RATE, vatFromGross, netFromGross } from '@/lib/vat';
import {
  AutoGrowTextarea, Card, ERROR_COLOR, Field, FieldMessage, WARNING_COLOR, invalidStyle, secondary, subdued, text,
} from '../../_components/EditorFields';

// Every new image is uploaded in the same save request, and Vercel rejects request bodies over 4.5 MB
const UPLOAD_WARNING_BYTES = 4 * 1024 * 1024;

let mediaKeyCounter = 0;
const nextMediaKey = () => `media-${++mediaKeyCounter}`;

function initialForm(product) {
  const asText = (value) => (value === null || value === undefined ? '' : String(value));
  return {
    name: product?.name || '',
    description: product?.description || '',
    long_description: product?.long_description || '',
    price: asText(product?.price),
    comparedprice: asText(product?.comparedprice),
    stock_quantity: asText(product?.stock_quantity),
    brandId: asText(product?.brand_id),
    status: product?.status || 'active',
    size: product?.size || '',
    form: product?.form || '',
    benefits: product?.benefits || '',
    how_to_use: product?.how_to_use || '',
    ingredients: product?.ingredients || '',
    how_to_use_video: product?.how_to_use_video || '',
    categoryIds: product?.category_ids || [],
    concernIds: product?.concern_ids || [],
  };
}

// The first media item is the product's main image
function initialMedia(product) {
  if (!product) return [];
  const main = product.imageUrl ? [{ key: nextMediaKey(), url: product.imageUrl, alt: product.altText || '' }] : [];
  const gallery = (product.additionalImagesData || []).map(img => ({ key: nextMediaKey(), url: img.url, alt: img.alt || '' }));
  return [...main, ...gallery];
}

const snapshot = (form, media) => JSON.stringify({ form, media: media.map(m => [m.url || m.file?.name, m.alt]) });



// The card-processing allowance baked into prices in the Sept 2026 reprice.
// Illustrative here — nothing is added at checkout, the price already covers it.
const CARD_FEE_RATE = 0.03;
// What a price is left worth after VAT comes out and Stripe takes its cut:
// 1/1.05 - 0.03. Inverted, it turns a target margin back into a shelf price.
const KEEP_FACTOR = 1 / (1 + VAT_RATE) - CARD_FEE_RATE;

/**
 * Prices are VAT-inclusive, so the Price field IS what the customer is charged.
 * This unpacks that figure — VAT out, card fee out, what's left — because the
 * number worth deciding on is the last one, and it isn't the one being typed.
 */
function PriceBreakdown({ price }) {
  const gross = Number(price);
  if (!Number.isFinite(gross) || gross <= 0) {
    return (
      <p className="text-[12.5px]" style={subdued}>
        Enter a price to see what it leaves you after VAT and card fees.
      </p>
    );
  }

  const vat  = vatFromGross(gross);
  const net  = netFromGross(gross);
  const fee  = Math.round(gross * CARD_FEE_RATE * 100) / 100;
  const keep = Math.round((net - fee) * 100) / 100;

  const line = (label, value, opts = {}) => (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="text-[12.5px]" style={opts.strong ? text : secondary}>{label}</span>
      <span
        className={`text-[12.5px] tabular-nums ${opts.strong ? 'font-semibold' : 'font-medium'}`}
        style={opts.strong ? text : secondary}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div>
      {line('Customer is charged', fmtAed(gross), { strong: true })}
      {line(`Less VAT (${(VAT_RATE * 100).toFixed(0)}%, already inside the price)`, `− ${fmtAed(vat)}`)}
      {line('Net of VAT', fmtAed(net))}
      {line(`Less card fee (about ${(CARD_FEE_RATE * 100).toFixed(0)}%)`, `− ${fmtAed(fee)}`)}
      <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--sp-border)' }}>
        {line('You keep', fmtAed(keep), { strong: true })}
      </div>
      <p className="text-[11.5px] mt-2 leading-relaxed" style={subdued}>
        Nothing is added at checkout — this price is exactly what the customer pays.
        To keep a round {fmtAed(Math.ceil(keep / 10) * 10)}, price it at{' '}
        <strong style={text}>{fmtAed(Math.ceil((Math.ceil(keep / 10) * 10) / KEEP_FACTOR))}</strong>.
      </p>
    </div>
  );
}

const MoneyInput = ({ id, value, onChange, error }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none" style={subdued}>AED</span>
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min="0"
      step="0.01"
      value={value}
      onChange={onChange}
      placeholder="0.00"
      className="sp-input"
      style={invalidStyle(error, { paddingLeft: 48 })}
      aria-invalid={!!error}
    />
  </div>
);

export default function ProductEditor({ product, onSaved }) {
  const router = useRouter();
  const { brands, categories, concerns, loading, addProduct, updateProduct, deleteProduct, toggleProductStatus } = useAppContext();
  const isNew = !product;

  const [form, setForm] = useState(() => initialForm(product));
  const [media, setMedia] = useState(() => initialMedia(product));
  const [isActive, setIsActive] = useState(product?.is_active !== false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // What the editor looked like when it opened (or was last saved), to detect unsaved changes
  const baselineRef = useRef(null);
  if (baselineRef.current === null) baselineRef.current = snapshot(form, media);
  const isDirty = snapshot(form, media) !== baselineRef.current;

  // Free the in-memory previews of new images when leaving the page
  const mediaRef = useRef(media);
  mediaRef.current = media;
  useEffect(() => () => mediaRef.current.forEach(m => m.preview && URL.revokeObjectURL(m.preview)), []);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };
  const bind = (name) => ({ id: name, name, value: form[name], onChange: e => setField(name, e.target.value) });
  const toggleId = (name, id) => setField(name, form[name].includes(id) ? form[name].filter(x => x !== id) : [...form[name], id]);

  // ── Media ──
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length < files.length) toast.error('Only image files can be added.');
    if (images.length === 0) return;
    setMedia(prev => [...prev, ...images.map(file => ({ key: nextMediaKey(), file, preview: URL.createObjectURL(file), alt: '' }))]);
  };
  const removeMedia = (key) => {
    const item = media.find(m => m.key === key);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    setMedia(prev => prev.filter(m => m.key !== key));
  };
  const makeMain = (key) => setMedia(prev => [prev.find(m => m.key === key), ...prev.filter(m => m.key !== key)]);
  const setAlt = (key, alt) => setMedia(prev => prev.map(m => (m.key === key ? { ...m, alt } : m)));
  const selected = media.find(m => m.key === selectedKey) || media[0];
  const selectedIndex = selected ? media.indexOf(selected) : -1;
  const newUploadBytes = media.reduce((sum, m) => sum + (m.file?.size || 0), 0);

  // ── Save ──
  const validate = () => {
    const found = {};
    if (!form.name.trim()) found.name = 'Add a product title.';
    if (!form.description.trim()) found.description = 'Add a short description.';
    const price = Number(form.price);
    if (form.price === '' || !Number.isFinite(price) || price < 0) found.price = 'Enter a price of 0 or more.';
    const stock = Number(form.stock_quantity);
    if (form.stock_quantity === '' || !Number.isInteger(stock) || stock < 0) found.stock_quantity = 'Enter a whole number of 0 or more.';
    if (!form.brandId) found.brandId = 'Choose a brand.';
    if (form.categoryIds.length === 0) found.categoryIds = 'Choose at least one category.';
    if (form.how_to_use_video && !/^https?:\/\//.test(form.how_to_use_video)) found.how_to_use_video = 'Enter a full link starting with https://';
    return found;
  };

  const buildFormData = () => {
    const fd = new FormData();
    ['name', 'description', 'long_description', 'price', 'comparedprice', 'stock_quantity', 'status',
      'size', 'form', 'benefits', 'how_to_use', 'ingredients', 'how_to_use_video']
      .forEach(key => fd.append(key, form[key].trim()));
    fd.append('brand_id', form.brandId);
    fd.append('categoryIds', form.categoryIds.join(','));
    fd.append('concernIds', form.concernIds.join(','));

    const [main, ...gallery] = media;
    if (main?.file) fd.append('mainImage', main.file);
    fd.append('imageUrl', main?.url || '');
    fd.append('mainAltText', main?.alt || '');
    if (!main) fd.append('removeMainImage', 'true');
    gallery.forEach(item => {
      if (item.url) {
        fd.append('existingAdditionalImages', item.url);
        fd.append('existingAdditionalAlts', item.alt || '');
      } else {
        fd.append('additionalImages', item.file);
        fd.append('additionalAlts', item.alt || '');
      }
    });
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
      const fd = buildFormData();
      if (isNew) {
        const response = await addProduct(fd);
        const { productId } = await response.json();
        baselineRef.current = snapshot(form, media);
        toast.success('Product created');
        router.replace(`/admin/products/${productId}`);
      } else {
        await updateProduct(product.id, fd);
        baselineRef.current = snapshot(form, media);
        toast.success('Product saved');
        onSaved?.();
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The product could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Cmd/Ctrl+S saves, like other editors
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
      baselineRef.current = snapshot(form, media);
      router.push('/admin/products');
      return;
    }
    media.forEach(m => m.preview && URL.revokeObjectURL(m.preview));
    setForm(initialForm(product));
    setMedia(initialMedia(product));
    setErrors({});
    setSelectedKey(null);
  };

  const confirmLeave = (e) => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  const handleVisibility = async () => {
    const show = !isActive;
    try {
      await toggleProductStatus(product.id, show);
      setIsActive(show);
      toast.success(show ? 'Product is visible on the store' : 'Product hidden from the store');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Visibility could not be changed.'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await deleteProduct(product.id);
      baselineRef.current = snapshot(form, media);
      toast.success('Product deleted');
      router.push('/admin/products');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The product could not be deleted.'));
    }
  };

  if (loading) return <PageLoader />;

  const headerStatus = productStatus({ status: product?.status, is_active: isActive });
  const stock = form.stock_quantity === '' ? null : stockState(form.stock_quantity);
  const price = Number(form.price);
  const compareAt = Number(form.comparedprice);
  const hasCompareAt = form.comparedprice !== '' && form.price !== '';
  const discount = hasCompareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  const compareWarning = hasCompareAt && compareAt <= price;
  const showSaveBar = isNew || isDirty;

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/admin/products"
          onClick={confirmLeave}
          aria-label="Back to products"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
          style={secondary}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[20px] font-semibold truncate min-w-0 max-w-full" style={text}>{isNew ? 'Add product' : product.name}</h1>
        {!isNew && <span className={`sp-badge ${headerStatus.cls}`}>{headerStatus.label}</span>}
        {!isNew && (
          <div className="ml-auto flex items-center gap-2">
            <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="sp-btn sp-btn-secondary">
              <ExternalLink size={14} />View on store
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="sp-btn sp-btn-secondary px-2.5" aria-label="More actions"><MoreHorizontal size={16} /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[190px]">
                <DropdownMenuItem onClick={handleVisibility} className="rounded-md px-3 py-2 text-[13px] gap-2">
                  {isActive ? <><EyeOff size={14} />Hide from store</> : <><Eye size={14} />Show on store</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
                  <Trash2 size={14} />Delete product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {!isNew && !isActive && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-[13px]" style={{ background: '#fff4e5', border: '1px solid #ffd79d', color: '#5e4200' }}>
          <EyeOff size={16} className="shrink-0" />
          <span className="flex-1 min-w-[200px]">This product is hidden. Customers can&apos;t see or buy it.</span>
          <button type="button" onClick={handleVisibility} className="sp-btn sp-btn-secondary">Show on store</button>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); save(); }} noValidate>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">

          {/* ── Main column ── */}
          <div className="space-y-4 min-w-0">
            <Card>
              <div className="space-y-4">
                <Field label="Title" htmlFor="name" error={errors.name}>
                  <input type="text" {...bind('name')} placeholder="e.g. Zorah Sublime Night Cream" className="sp-input" style={invalidStyle(errors.name)} aria-invalid={!!errors.name} />
                </Field>
                <Field label="Short description" htmlFor="description" error={errors.description} hint="One or two sentences for product cards and search results.">
                  <AutoGrowTextarea {...bind('description')} minRows={2} style={invalidStyle(errors.description)} aria-invalid={!!errors.description} />
                </Field>
                <Field label="Full description" htmlFor="long_description" optional hint="The detailed story shown on the product page.">
                  <AutoGrowTextarea {...bind('long_description')} minRows={5} />
                </Field>
              </div>
            </Card>

            <Card
              title="Media"
              description="The first image is the main image customers see first. Drag images here or click to upload."
              action={media.length > 0 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="sp-btn sp-btn-plain shrink-0">
                  <ImagePlus size={14} />Add images
                </button>
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
              />
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                className="rounded-xl"
                style={dragging ? { outline: '2px dashed var(--sp-focus)', outlineOffset: 4 } : undefined}
              >
                {media.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-10 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 hover:bg-[#fafafa] transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--sp-border-strong)' }}
                  >
                    <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f1f1f1' }}>
                      <ImagePlus size={18} style={secondary} />
                    </span>
                    <span className="text-[13px] font-semibold" style={text}>Add images</span>
                    <span className="text-[12px]" style={subdued}>or drop files here · square PNG or JPG on a clean background looks best</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {media.map((item, index) => (
                      <div
                        key={item.key}
                        className={`group relative rounded-lg overflow-hidden bg-white ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                        style={{ boxShadow: selected?.key === item.key ? '0 0 0 2px var(--sp-focus)' : '0 0 0 1px var(--sp-border)' }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedKey(item.key)}
                          className="block w-full aspect-square cursor-pointer"
                          aria-label={`Select image ${index + 1} to edit its alt text`}
                        >
                          <img src={item.preview || item.url} alt={item.alt} className="w-full h-full object-contain p-2" />
                        </button>
                        {index === 0 && (
                          <span className="absolute left-2 top-2 sp-badge" style={{ background: '#ffffff', boxShadow: '0 0 0 1px var(--sp-border)' }}>Main</span>
                        )}
                        {item.file && <span className="absolute left-2 bottom-2 sp-badge sp-badge-info">New</span>}
                        <div className="absolute right-1.5 top-1.5 flex gap-1 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => makeMain(item.key)}
                              title="Make main image"
                              aria-label="Make main image"
                              className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm hover:bg-[#f1f1f1] cursor-pointer"
                              style={secondary}
                            >
                              <Star size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(item.key)}
                            title="Remove image"
                            aria-label="Remove image"
                            className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm hover:bg-red-50 text-red-600 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:bg-[#fafafa] transition-colors cursor-pointer"
                      style={{ borderColor: 'var(--sp-border-strong)', ...subdued }}
                    >
                      <ImagePlus size={18} />
                      <span className="text-[12px] font-medium">Add</span>
                    </button>
                  </div>
                )}
              </div>

              {selected && (
                <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: '1px solid #f1f1f1' }}>
                  <img src={selected.preview || selected.url} alt="" className="w-14 h-14 rounded-lg object-contain bg-white shrink-0 p-1" style={{ border: '1px solid var(--sp-border)' }} />
                  <div className="flex-1 min-w-0">
                    <Field
                      label={`Alt text · ${selectedIndex === 0 ? 'main image' : `image ${selectedIndex + 1}`}`}
                      htmlFor="media-alt"
                      hint="Describes the image for screen readers and search engines. Click another image to edit its text."
                    >
                      <input
                        id="media-alt"
                        type="text"
                        value={selected.alt}
                        onChange={e => setAlt(selected.key, e.target.value)}
                        placeholder="e.g. Zorah Sublime Night Cream jar, 50 ml"
                        className="sp-input"
                      />
                    </Field>
                  </div>
                </div>
              )}
              {newUploadBytes > UPLOAD_WARNING_BYTES && (
                <FieldMessage color={WARNING_COLOR}>
                  New images add up to {(newUploadBytes / 1024 / 1024).toFixed(1)} MB. Saves over about 4 MB can fail — use smaller files or add a few at a time.
                </FieldMessage>
              )}
            </Card>

            <Card title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Price"
                  htmlFor="price"
                  error={errors.price}
                  hint="What the customer sees and pays. VAT is already included."
                >
                  <MoneyInput id="price" value={form.price} onChange={e => setField('price', e.target.value)} error={errors.price} />
                </Field>
                <Field
                  label="Compare-at price"
                  htmlFor="comparedprice"
                  optional
                  hint={compareWarning ? undefined : discount > 0
                    ? `Customers see ${discount}% off, with ${fmtAed(compareAt)} crossed out.`
                    : 'The original price, shown crossed out to mark a sale.'}
                >
                  <MoneyInput id="comparedprice" value={form.comparedprice} onChange={e => setField('comparedprice', e.target.value)} />
                  {compareWarning && <FieldMessage color={WARNING_COLOR}>Set it higher than the price, or it won&apos;t show as a sale.</FieldMessage>}
                </Field>
              </div>

              <div
                className="mt-4 rounded-lg px-4 py-3"
                style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={subdued}>
                  What this price is worth
                </p>
                <PriceBreakdown price={form.price} />
              </div>
            </Card>

            <Card title="Inventory">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Quantity in stock"
                  htmlFor="stock_quantity"
                  error={errors.stock_quantity}
                  hint={stock && <span style={{ color: stock.color }}>{stock.hint}</span>}
                >
                  <input type="number" inputMode="numeric" min="0" step="1" {...bind('stock_quantity')} className="sp-input" style={invalidStyle(errors.stock_quantity)} aria-invalid={!!errors.stock_quantity} />
                </Field>
                <Field label="Size / volume" htmlFor="size" optional>
                  <input type="text" {...bind('size')} placeholder="e.g. 50 ml" className="sp-input" />
                </Field>
              </div>
            </Card>

            <Card title="Product details" description="Shown in the information tabs on the product page.">
              <div className="space-y-4">
                <Field label="Form" htmlFor="form" optional>
                  <input type="text" {...bind('form')} placeholder="e.g. Cream, Serum, Eau de parfum" className="sp-input" />
                </Field>
                <Field label="Benefits" htmlFor="benefits" optional>
                  <AutoGrowTextarea {...bind('benefits')} />
                </Field>
                <Field label="How to use" htmlFor="how_to_use" optional>
                  <AutoGrowTextarea {...bind('how_to_use')} />
                </Field>
                <Field label="Ingredients" htmlFor="ingredients" optional>
                  <AutoGrowTextarea {...bind('ingredients')} />
                </Field>
                <Field
                  label="How-to-use video link"
                  htmlFor="how_to_use_video"
                  optional
                  error={errors.how_to_use_video}
                  hint="A direct link to an MP4 video, for example from Cloudinary."
                >
                  <div className="relative">
                    <Video size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={subdued} />
                    <input
                      type="url"
                      {...bind('how_to_use_video')}
                      placeholder="https://res.cloudinary.com/…/video.mp4"
                      className="sp-input"
                      style={invalidStyle(errors.how_to_use_video, { paddingLeft: 34 })}
                      aria-invalid={!!errors.how_to_use_video}
                    />
                  </div>
                  {/^https?:\/\//.test(form.how_to_use_video) && (
                    <video src={form.how_to_use_video} controls preload="metadata" className="mt-3 w-full max-h-56 rounded-lg bg-black" />
                  )}
                </Field>
              </div>
            </Card>

            <Card title="Search engine listing" description="A preview of how this product can appear in Google results.">
              <div className="rounded-lg p-4" style={{ background: 'var(--sp-surface-sub)' }}>
                <p className="text-[12px] truncate" style={secondary}>nayalc.com › product › {isNew ? 'new' : product.id}</p>
                <p className="text-[17px] leading-snug mt-0.5 truncate" style={{ color: '#1a0dab' }}>
                  {form.name.trim() || 'Product title'} | Naya Lumière Cosmetics
                </p>
                <p className="text-[13px] mt-1 line-clamp-2" style={secondary}>
                  {(form.description.trim() || 'Your short description appears here.').slice(0, 160)}
                </p>
              </div>
            </Card>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-4 lg:sticky lg:top-0">
            <Card title="Status">
              <select {...bind('status')} className="sp-input cursor-pointer">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
              <p className="text-[12px] mt-2" style={subdued}>
                {form.status === 'draft'
                  ? 'Draft products stay hidden from the store until you set them to active.'
                  : 'Active products are visible on the store and can be bought.'}
              </p>
            </Card>

            <Card title="Product organization">
              <div className="space-y-5">
                <Field label="Brand" htmlFor="brandId" error={errors.brandId}>
                  <select {...bind('brandId')} className="sp-input cursor-pointer" style={invalidStyle(errors.brandId)} aria-invalid={!!errors.brandId}>
                    <option value="">Choose a brand</option>
                    {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                </Field>

                <fieldset aria-invalid={!!errors.categoryIds} tabIndex={-1} className="outline-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <legend className="text-[13px] font-medium" style={secondary}>Categories</legend>
                    <Link href="/admin/categories" className="text-[12px] sp-link">Manage</Link>
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto -mx-1 px-1">
                    {categories.map(c => {
                      const checked = form.categoryIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2.5 py-1.5 px-1 rounded-md cursor-pointer hover:bg-[#f7f7f7] text-[13px]" style={checked ? text : secondary}>
                          <input type="checkbox" className="sp-check" checked={checked} onChange={() => toggleId('categoryIds', c.id)} />
                          {c.name}
                        </label>
                      );
                    })}
                    {categories.length === 0 && <p className="text-[12px]" style={subdued}>No categories yet.</p>}
                  </div>
                  {errors.categoryIds && <FieldMessage color={ERROR_COLOR}>{errors.categoryIds}</FieldMessage>}
                </fieldset>

                <fieldset>
                  <legend className="text-[13px] font-medium mb-2" style={secondary}>
                    Skin concerns <span className="font-normal" style={subdued}>(optional)</span>
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {concerns.map(c => {
                      const on = form.concernIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleId('concernIds', c.id)}
                          className="h-7 px-2.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer"
                          style={on
                            ? { background: 'var(--sp-primary)', color: '#ffffff', border: '1px solid var(--sp-primary)' }
                            : { background: '#ffffff', color: 'var(--sp-text-secondary)', border: '1px solid var(--sp-border-strong)' }}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                    {concerns.length === 0 && <p className="text-[12px]" style={subdued}>No skin concerns defined.</p>}
                  </div>
                </fieldset>
              </div>
            </Card>
          </div>
        </div>

        {/* Save bar — always shown for a new product, and for an existing one once something changes */}
        {showSaveBar && (
          <div className="sticky bottom-4 z-20 mt-4">
            <div className="sp-card flex items-center gap-3 px-4 py-3" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <p className="text-[13px] font-medium flex-1" style={text}>
                {isNew ? 'New product' : 'Unsaved changes'}
                <span className="hidden sm:inline font-normal ml-2" style={subdued}>Press ⌘S / Ctrl+S to save</span>
              </p>
              <button type="button" onClick={discard} disabled={saving} className="sp-btn sp-btn-secondary">Discard</button>
              <button type="submit" disabled={saving} className="sp-btn sp-btn-primary min-w-[110px]">
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : isNew ? 'Save product' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
