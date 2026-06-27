'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';
import {
  Plus, Edit, Trash2, Search, Loader2,
  MoreHorizontal, LayoutGrid, List, Filter,
  ExternalLink, Archive, CheckCircle2, DollarSign,
  EyeOff, Eye, Video, Upload, Download,
} from 'lucide-react';
import Modal from '../../components/Modal';
import PageLoader from '@/app/components/PageLoader';
import AutoResizeTextarea from '../../components/AutoResizeTextarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const FIELD_CLS = 'sp-input';
const LABEL_CLS = 'block sp-label mb-1.5';
const SECTION_TITLE = 'sp-section-title mb-4 flex items-center gap-2';

const ManageProducts = () => {
  const { adminProducts: products, categories, concerns, brands, addProduct, updateProduct, deleteProduct, toggleProductStatus, loading: isDataLoading } = useAppContext();
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const isEditMode = !!editingProduct;
  const [imageFile, setImageFile] = useState(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const getInitialFormData = useCallback((product) => {
    const categories = product?.category_ids || product?.categories?.map(c => c.id) || [];
    const concerns = product?.concern_ids || [];
    return {
      name:              product?.name              || '',
      description:       product?.description       || '',
      price:             product?.price             || '',
      stock_quantity:    product?.stock_quantity    || '',
      categoryIds:       Array.isArray(categories) ? categories : [],
      concernIds:        Array.isArray(concerns) ? concerns : [],
      brand:             product?.brandName         || product?.brand || '',
      imageUrl:          product?.imageUrl          || '',
      altText:           product?.altText           || '',
      additionalImages:  product?.additionalImagesData || [],
      comparedprice:     product?.comparedprice     || '',
      ingredients:       product?.ingredients       || '',
      long_description:  product?.long_description  || '',
      benefits:          product?.benefits          || '',
      how_to_use:        product?.how_to_use        || '',
      how_to_use_video:  product?.how_to_use_video  || '',
      size:              product?.size              || '',
      form:              product?.form              || '',
      status:            product?.status            || 'active',
    };
  }, []);

  const [formData, setFormData] = useState(() => getInitialFormData(null));

  useEffect(() => {
    setFormData(getInitialFormData(isEditMode ? editingProduct : null));
    setAdditionalImageFiles([]);
  }, [isEditMode, editingProduct, getInitialFormData]);

  const handleOpenAddModal  = () => { setEditingProduct(null); setIsModalOpen(true); };
  const handleOpenEditModal = (p) => { setEditingProduct(p); setIsModalOpen(true); };
  const handleDelete = (id) => { if (window.confirm('Delete this product?')) deleteProduct(id); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); setImageFile(null); setAdditionalImageFiles([]); };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price','stock_quantity','comparedprice'].includes(name) ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };
  const handleCategoryChange = (id, checked) =>
    setFormData(prev => {
      const currentIds = Array.isArray(prev.categoryIds) ? prev.categoryIds : [];
      return { ...prev, categoryIds: checked ? [...currentIds, id] : currentIds.filter(x => x !== id) };
    });
  const handleConcernChange = (id, checked) =>
    setFormData(prev => {
      const currentIds = Array.isArray(prev.concernIds) ? prev.concernIds : [];
      return { ...prev, concernIds: checked ? [...currentIds, id] : currentIds.filter(x => x !== id) };
    });
  const handleFileChange = (e) => setImageFile(e.target.files[0]);
  const handleAdditionalFilesChange = (e) =>
    setAdditionalImageFiles(prev => [...prev, ...Array.from(e.target.files).map(f => ({ file: f, alt: '' }))]);
  const handleNewAdditionalAltChange = (i, alt) =>
    setAdditionalImageFiles(prev => { const n=[...prev]; n[i]={...n[i],alt}; return n; });
  const handleExistingAdditionalAltChange = (url, alt) =>
    setFormData(prev => ({ ...prev, additionalImages: prev.additionalImages.map(img => img.url===url ? {...img,alt} : img) }));
  const removeNewAdditionalImage = (i) => setAdditionalImageFiles(prev => prev.filter((_,x) => x!==i));
  const removeExistingAdditionalImage = (url) =>
    setFormData(prev => ({ ...prev, additionalImages: prev.additionalImages.filter(img => img.url!==url) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const brand = brands.find(b => b.name === formData.brand);
      const fd = new FormData();
      for (const key in { ...formData, brand_id: brand?.id ?? null }) {
        const v = key === 'brand_id' ? (brand?.id ?? null) : formData[key];
        if (key === 'additionalImages') {
          v.forEach(img => { fd.append('existingAdditionalImages', img.url); fd.append('existingAdditionalAlts', img.alt||''); });
        } else if (key === 'categoryIds' || key === 'concernIds') {
          fd.append(key, v.join(','));
        } else if (Array.isArray(v)) {
          v.forEach(x => fd.append(key, x));
        } else {
          fd.append(key, v);
        }
      }
      if (imageFile) fd.append('mainImage', imageFile);
      fd.append('mainAltText', formData.altText || '');
      additionalImageFiles.forEach(entry => { fd.append('additionalImages', entry.file); fd.append('additionalAlts', entry.alt||''); });
      editingProduct ? await updateProduct(editingProduct.id, fd) : await addProduct(fd);
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isDataLoading) return <PageLoader />;

  const isHidden = (p) => p.is_active === false || p.status === 'draft';

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--sp-text)' }}>Products</h1>
        <div className="flex items-center gap-2">
          <button className="sp-btn sp-btn-secondary"><Download size={14} /> Export</button>
          <button className="sp-btn sp-btn-secondary"><Upload size={14} /> Import</button>
          <button onClick={handleOpenAddModal} className="sp-btn sp-btn-primary"><Plus size={15} /> Add product</button>
        </div>
      </div>

      <div className="sp-card overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--sp-text-subdued)' }} />
            <input type="text" placeholder="Search and filter" className="sp-input pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex rounded-lg p-0.5" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
            <button onClick={() => setViewMode('list')} className="p-1.5 rounded-md transition-all" style={viewMode==='list' ? { background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } : {}}>
              <List size={15} style={{ color: 'var(--sp-text-secondary)' }} />
            </button>
            <button onClick={() => setViewMode('grid')} className="p-1.5 rounded-md transition-all" style={viewMode==='grid' ? { background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } : {}}>
              <LayoutGrid size={15} style={{ color: 'var(--sp-text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* List view (Shopify default) */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th><th>Status</th><th>Inventory</th><th>Brand</th><th className="text-right">Price</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: '#f1f1f1', border: '1px solid var(--sp-border)' }}>
                          <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-1" />
                        </div>
                        <button onClick={() => handleOpenEditModal(product)} className="text-[13px] font-medium text-left sp-link">{product.name}</button>
                      </div>
                    </td>
                    <td>
                      <span className={`sp-badge ${isHidden(product) ? 'sp-badge-neutral' : 'sp-badge-success'}`}>
                        {isHidden(product) ? 'Unlisted' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: product.stock_quantity <= 5 ? '#b42318' : 'var(--sp-text)' }}>
                        {product.stock_quantity} in stock
                      </span>
                    </td>
                    <td style={{ color: 'var(--sp-text-secondary)' }}>{(!product.brandName || product.brandName === 'null') ? '—' : product.brandName}</td>
                    <td className="text-right font-semibold">AED {product.price.toFixed(2)}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-[#f1f1f1]"><MoreHorizontal size={16} style={{ color: 'var(--sp-text-secondary)' }} /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg p-1">
                          <DropdownMenuItem onClick={() => handleOpenEditModal(product)} className="rounded-md px-3 py-2 text-[13px] gap-2"><Edit size={14} /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/product/${product.id}`, '_blank')} className="rounded-md px-3 py-2 text-[13px] gap-2"><ExternalLink size={14} /> View live</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleProductStatus(product.id, !product.is_active)} className="rounded-md px-3 py-2 text-[13px] gap-2">
                            {product.is_active !== false ? <><EyeOff size={14} /> Deactivate</> : <><Eye size={14} /> Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(product.id)} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50"><Trash2 size={14} /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid view */
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(product => (
              <div key={product.id} className="sp-card overflow-hidden flex flex-col group">
                <div className="relative aspect-square cursor-pointer" style={{ background: '#f7f7f7' }} onClick={() => handleOpenEditModal(product)}>
                  <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4" sizes="280px" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isHidden(product) && <span className="sp-badge sp-badge-neutral">Unlisted</span>}
                    {product.stock_quantity <= 5 && <span className="sp-badge sp-badge-warning">Low stock</span>}
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <p className="text-[13px] font-medium leading-snug mb-2 flex-grow" style={{ color: 'var(--sp-text)' }}>{product.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold">AED {product.price.toFixed(2)}</span>
                    <button onClick={() => handleOpenEditModal(product)} className="sp-btn sp-btn-secondary text-[12px] py-1.5 px-3">Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Archive size={32} style={{ color: 'var(--sp-text-subdued)' }} />
            <p className="text-[13px]" style={{ color: 'var(--sp-text-subdued)' }}>No products found</p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditMode ? 'Edit product' : 'Add product'} size="max-w-5xl" noBodyPadding>
        <form onSubmit={handleSubmit} className="relative">
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left column */}
              <div className="lg:col-span-8 space-y-6">
                <section className="sp-card sp-card-pad">
                  <p className={SECTION_TITLE}>Basic info</p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className={LABEL_CLS}>Product name</label>
                      <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} placeholder="Enter product name…" className={FIELD_CLS} required disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="description" className={LABEL_CLS}>Short description</label>
                      <AutoResizeTextarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Brief summary…" className={FIELD_CLS} required disabled={isSubmitting} />
                    </div>
                  </div>
                </section>

                <section className="sp-card sp-card-pad grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className={SECTION_TITLE}>Details</p>
                    <div>
                      <label htmlFor="benefits" className={LABEL_CLS}>Benefits</label>
                      <textarea name="benefits" id="benefits" value={formData.benefits} onChange={handleChange} rows={2} className={`${FIELD_CLS} resize-y min-h-[80px]`} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="how_to_use" className={LABEL_CLS}>How to use</label>
                      <textarea name="how_to_use" id="how_to_use" value={formData.how_to_use} onChange={handleChange} rows={2} className={`${FIELD_CLS} resize-y min-h-[80px]`} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label htmlFor="how_to_use_video" className={LABEL_CLS}><span className="flex items-center gap-1.5"><Video size={11} /> How to use — video URL</span></label>
                      <input type="url" name="how_to_use_video" id="how_to_use_video" value={formData.how_to_use_video} onChange={handleChange} placeholder="https://res.cloudinary.com/…/video.mp4" className={FIELD_CLS} disabled={isSubmitting} />
                      {formData.how_to_use_video && (
                        <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--sp-border)' }}>
                          <video src={formData.how_to_use_video} controls className="w-full max-h-48 object-contain bg-black" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className={SECTION_TITLE}>Ingredients</p>
                    <div>
                      <label htmlFor="ingredients" className={LABEL_CLS}>Ingredient list</label>
                      <textarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} rows={2} className={`${FIELD_CLS} resize-y min-h-[80px]`} disabled={isSubmitting} />
                    </div>
                  </div>
                </section>

                <section className="sp-card sp-card-pad">
                  <p className={SECTION_TITLE}>Images</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <label className={LABEL_CLS}>Main image</label>
                      <div className="relative aspect-square rounded-lg border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-[#fafafa] transition-colors" style={{ borderColor: 'var(--sp-border-strong)', background: 'var(--sp-surface-sub)' }}>
                        {imageFile ? (
                          <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-contain p-6" />
                        ) : editingProduct?.imageUrl ? (
                          <Image src={editingProduct.imageUrl} alt="Current" fill className="object-contain p-6" />
                        ) : (
                          <div className="flex flex-col items-center gap-2" style={{ color: 'var(--sp-text-subdued)' }}>
                            <Plus size={28} /><span className="text-[12px] font-medium">Select image</span>
                          </div>
                        )}
                        <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isSubmitting} />
                      </div>
                      <div>
                        <label htmlFor="altText" className={LABEL_CLS}>Alt text</label>
                        <input type="text" name="altText" id="altText" value={formData.altText} onChange={handleChange} placeholder="Image description for SEO…" className={FIELD_CLS} disabled={isSubmitting} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="rounded-lg p-5 space-y-2.5" style={{ background: 'var(--sp-surface-sub)', border: '1px solid var(--sp-border)' }}>
                        <p className="text-[13px] font-semibold mb-3">Image guidelines</p>
                        {['Product centered in frame','Soft, uniform lighting','High resolution (2000×2000px)','PNG with transparency preferred'].map((t, i) => (
                          <p key={i} className="text-[12px] flex items-center gap-2" style={{ color: 'var(--sp-text-secondary)' }}>
                            <span className="w-1 h-1 rounded-full bg-[#8a8a8a] shrink-0" />{t}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={LABEL_CLS}>Gallery images</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.additionalImages.map((img, i) => (
                        <div key={`ex-${i}`} className="sp-card p-2 space-y-2">
                          <div className="relative aspect-square rounded-md overflow-hidden group/img" style={{ background: 'var(--sp-surface-sub)' }}>
                            <Image src={img.url} alt="" fill className="object-contain p-1" />
                            <button type="button" onClick={() => removeExistingAdditionalImage(img.url)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10"><Trash2 size={11} /></button>
                          </div>
                          <input type="text" value={img.alt||''} onChange={e => handleExistingAdditionalAltChange(img.url, e.target.value)} placeholder="Alt text…" className="sp-input text-[11px] py-1.5" disabled={isSubmitting} />
                        </div>
                      ))}
                      {additionalImageFiles.map((entry, i) => (
                        <div key={`new-${i}`} className="sp-card p-2 space-y-2">
                          <div className="relative aspect-square rounded-md overflow-hidden group/img" style={{ background: 'var(--sp-surface-sub)' }}>
                            <Image src={URL.createObjectURL(entry.file)} alt="" fill className="object-contain p-1" />
                            <button type="button" onClick={() => removeNewAdditionalImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10"><Trash2 size={11} /></button>
                          </div>
                          <input type="text" value={entry.alt} onChange={e => handleNewAdditionalAltChange(i, e.target.value)} placeholder="Alt text…" className="sp-input text-[11px] py-1.5" disabled={isSubmitting} />
                        </div>
                      ))}
                      <div className="relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center hover:bg-[#fafafa] transition-all cursor-pointer min-h-[120px]" style={{ borderColor: 'var(--sp-border-strong)', color: 'var(--sp-text-subdued)' }}>
                        <Plus size={20} /><span className="text-[11px] font-medium mt-1.5">Add photo</span>
                        <input type="file" multiple onChange={handleAdditionalFilesChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isSubmitting} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column */}
              <div className="lg:col-span-4 space-y-5">
                <div className="sp-card sp-card-pad space-y-4">
                  <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
                    <p className="text-[13px] font-semibold">Pricing</p><DollarSign size={14} style={{ color: 'var(--sp-text-subdued)' }} />
                  </div>
                  <div>
                    <label htmlFor="price" className={LABEL_CLS}>Price (AED)</label>
                    <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" className={FIELD_CLS} required disabled={isSubmitting} />
                  </div>
                  <div>
                    <label htmlFor="comparedprice" className={LABEL_CLS}>Compare-at price (AED)</label>
                    <input type="number" name="comparedprice" id="comparedprice" value={formData.comparedprice} onChange={handleChange} step="0.01" className={FIELD_CLS} disabled={isSubmitting} />
                  </div>
                </div>

                <div className="sp-card sp-card-pad space-y-4">
                  <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
                    <p className="text-[13px] font-semibold">Inventory</p><Archive size={14} style={{ color: 'var(--sp-text-subdued)' }} />
                  </div>
                  <div>
                    <label htmlFor="stock_quantity" className={LABEL_CLS}>Stock quantity</label>
                    <input type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className={FIELD_CLS} required disabled={isSubmitting} />
                  </div>
                </div>

                <div className="sp-card sp-card-pad space-y-5">
                  <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--sp-border)' }}>
                    <p className="text-[13px] font-semibold">Organization</p><Filter size={14} style={{ color: 'var(--sp-text-subdued)' }} />
                  </div>
                  <div>
                    <label htmlFor="brand" className={LABEL_CLS}>Brand</label>
                    <select name="brand" id="brand" value={formData.brand} onChange={handleChange} className={FIELD_CLS} required disabled={isSubmitting}>
                      <option value="">Select brand</option>
                      {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className={LABEL_CLS}>Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className={FIELD_CLS} required disabled={isSubmitting}>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="form" className={LABEL_CLS}>Form</label>
                    <input type="text" name="form" id="form" value={formData.form} onChange={handleChange} placeholder="e.g. Cream, Spray, Serum…" className={FIELD_CLS} disabled={isSubmitting} />
                  </div>
                  <div>
                    <label htmlFor="size" className={LABEL_CLS}>Size / volume</label>
                    <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} placeholder="e.g. 50ml, 100g, 1.7 oz…" className={FIELD_CLS} disabled={isSubmitting} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Categories</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {categories.map(c => (
                        <label key={c.id} className="flex items-center gap-2.5 cursor-pointer">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.categoryIds.includes(c.id) ? 'bg-[#303030] border-[#303030]' : 'border-[#d1d1d1]'}`}>
                            {formData.categoryIds.includes(c.id) && <CheckCircle2 size={11} className="text-white" />}
                          </div>
                          <input type="checkbox" checked={formData.categoryIds.includes(c.id)} onChange={e => handleCategoryChange(c.id, e.target.checked)} className="sr-only" disabled={isSubmitting} />
                          <span className="text-[13px]" style={{ color: formData.categoryIds.includes(c.id) ? 'var(--sp-text)' : 'var(--sp-text-secondary)' }}>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Skin concerns</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {concerns.map(con => (
                        <label key={con.id} className="flex items-center gap-2.5 cursor-pointer">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.concernIds.includes(con.id) ? 'bg-[#303030] border-[#303030]' : 'border-[#d1d1d1]'}`}>
                            {formData.concernIds.includes(con.id) && <CheckCircle2 size={11} className="text-white" />}
                          </div>
                          <input type="checkbox" checked={formData.concernIds.includes(con.id)} onChange={e => handleConcernChange(con.id, e.target.checked)} className="sr-only" disabled={isSubmitting} />
                          <span className="text-[13px]" style={{ color: formData.concernIds.includes(con.id) ? 'var(--sp-text)' : 'var(--sp-text-secondary)' }}>{con.name}</span>
                        </label>
                      ))}
                      {concerns.length === 0 && <p className="text-[12px] italic" style={{ color: 'var(--sp-text-subdued)' }}>No concerns defined.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 left-0 right-0 px-6 py-4 bg-white flex flex-row-reverse items-center gap-3 z-50" style={{ borderTop: '1px solid var(--sp-border)' }}>
            <button type="submit" disabled={isSubmitting} className="sp-btn sp-btn-primary min-w-[160px]">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isEditMode ? 'Update product' : 'Save product'}
            </button>
            <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="sp-btn sp-btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageProducts;
