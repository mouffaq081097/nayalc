'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';
import {
    Plus, Edit, Trash2, Search, Loader2, Package,
    MoreHorizontal, LayoutGrid, List, Filter,
    ExternalLink, Archive, CheckCircle2, AlertCircle, DollarSign,
    EyeOff, Eye, Video
} from 'lucide-react';
import Modal from '../../components/Modal';
import PageLoader from '@/app/components/PageLoader';
import { Button } from '@/app/components/ui/button';
import AutoResizeTextarea from '../../components/AutoResizeTextarea';
import { truncateText } from '@/app/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_CLS = 'w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all placeholder:text-gray-300';
const LABEL_CLS = 'block text-[11px] font-bold text-gray-400 mb-1.5';
const SECTION_TITLE = 'text-[10px] font-black text-purple-500 mb-5 flex items-center gap-2';

const ManageProducts = () => {
    const { adminProducts: products, categories, concerns, brands, addProduct, updateProduct, deleteProduct, toggleProductStatus, loading: isDataLoading } = useAppContext();
    const [isModalOpen,  setIsModalOpen]  = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const isEditMode = !!editingProduct;
    const [imageFile, setImageFile] = useState(null);
    const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

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
    const handleDelete = (id) => {
        if (window.confirm('Delete this product?')) deleteProduct(id);
    };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); setImageFile(null); setAdditionalImageFiles([]); };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: ['price','stock_quantity','comparedprice'].includes(name) 
                ? (value === '' ? '' : parseFloat(value)) 
                : value 
        }));
    };
    const handleCategoryChange = (id, checked) =>
        setFormData(prev => {
            const currentIds = Array.isArray(prev.categoryIds) ? prev.categoryIds : [];
            return {
                ...prev,
                categoryIds: checked 
                    ? [...currentIds, id] 
                    : currentIds.filter(x => x !== id)
            };
        });
    const handleConcernChange = (id, checked) =>
        setFormData(prev => {
            const currentIds = Array.isArray(prev.concernIds) ? prev.concernIds : [];
            return {
                ...prev,
                concernIds: checked 
                    ? [...currentIds, id] 
                    : currentIds.filter(x => x !== id)
            };
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

    return (
        <div className="space-y-6 pb-8">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'rgba(152,105,247,0.4)' }} />
                    <input
                        type="text" placeholder="Search products…"
                        className="w-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all rounded-full"
                        style={{
                            background: 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(216,180,254,0.55)',
                            color: '#3b0764',
                        }}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex rounded-full p-1" style={{ background: 'rgba(243,232,255,0.6)', border: '1px solid rgba(216,180,254,0.4)' }}>
                        <button onClick={() => setViewMode('grid')}
                            className="p-1.5 rounded-full transition-all"
                            style={viewMode==='grid' ? { background: '#fff', color: 'var(--brand-purple-2)', boxShadow: '0 1px 4px rgba(152,105,247,0.2)' } : { color: 'rgba(107,33,168,0.5)' }}>
                            <LayoutGrid size={15} />
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className="p-1.5 rounded-full transition-all"
                            style={viewMode==='list' ? { background: '#fff', color: 'var(--brand-purple-2)', boxShadow: '0 1px 4px rgba(152,105,247,0.2)' } : { color: 'rgba(107,33,168,0.5)' }}>
                            <List size={15} />
                        </button>
                    </div>

                    {/* Add button — elongated pill matching user-side CTA style */}
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 text-white text-[12px] font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg"
                        style={{
                            background: 'var(--brand-gradient)',
                            borderRadius: '99px',
                            padding: '9px 22px',
                            boxShadow: '0 4px 16px rgba(152,105,247,0.35)',
                            letterSpacing: '0.02em',
                        }}
                    >
                        <Plus size={14} strokeWidth={2.5} /> Add Product
                    </button>
                </div>
            </div>

            {/* Grid / List */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div key="grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(product => {
                            const brandName = (!product.brandName || product.brandName === 'null') ? null : product.brandName;
                            return (
                            <div key={product.id}
                                className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                                style={{ background: 'rgba(243,232,255,0.38)', border: '1px solid rgba(216,180,254,0.4)' }}
                            >
                                {/* Status badges */}
                                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                                    {(product.is_active === false || product.status === 'draft') && (
                                        <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-800/80 text-white border border-gray-600 backdrop-blur-sm flex items-center gap-1">
                                            <EyeOff size={8} /> Hidden
                                        </span>
                                    )}
                                    {product.stock_quantity <= 5 && (
                                        <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-orange-500 text-white flex items-center gap-1 shadow-sm">
                                            <AlertCircle size={8} /> Low Stock
                                        </span>
                                    )}
                                </div>

                                {/* Quick-action menu top-right */}
                                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-purple-100 flex items-center justify-center shadow-sm">
                                                <MoreHorizontal size={13} className="text-purple-400" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-purple-100 p-1.5">
                                            <DropdownMenuItem onClick={() => handleOpenEditModal(product)} className="rounded-lg px-3 py-2.5 text-sm gap-2.5">
                                                <Edit size={14} className="text-purple-500" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => window.open(`/product/${product.id}`, '_blank')} className="rounded-lg px-3 py-2.5 text-sm gap-2.5">
                                                <ExternalLink size={14} className="text-blue-500" /> View Live
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => toggleProductStatus(product.id, !product.is_active)}
                                                className="rounded-lg px-3 py-2.5 text-sm gap-2.5"
                                            >
                                                {product.is_active !== false ? (
                                                    <><EyeOff size={14} className="text-orange-500" /> Deactivate</>
                                                ) : (
                                                    <><Eye size={14} className="text-green-500" /> Activate</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(product.id)} className="rounded-lg px-3 py-2.5 text-sm gap-2.5 text-red-600 focus:bg-red-50">
                                                <Trash2 size={14} /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Image — white card inside lavender bg, mirrors user side */}
                                <div
                                    className="relative mx-3 mt-3 rounded-xl overflow-hidden cursor-pointer"
                                    style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.85)' }}
                                    onClick={() => handleOpenEditModal(product)}
                                >
                                    <Image
                                        src={product.imageUrl} alt={product.name} fill
                                        className="object-contain p-5 group-hover:scale-105 transition-transform duration-500"
                                        sizes="280px"
                                    />
                                </div>

                                {/* Info */}
                                <div className="px-4 pt-3 pb-4 flex flex-col flex-grow">
                                    {brandName && (
                                        <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--brand-purple-darker)' }}>
                                            {brandName}
                                        </p>
                                    )}
                                    <h3 className="text-[13px] font-medium leading-snug text-gray-800 flex-grow mb-3" style={{ fontStyle: 'italic' }}>
                                        {truncateText(product.name, 48)}
                                    </h3>

                                    {/* Price — matches user-side layout */}
                                    <div className="mb-3">
                                        <span className="text-[9px] font-bold text-gray-400 block">AED</span>
                                        <span className="text-xl font-black leading-none" style={{ color: '#3b0764' }}>
                                            {product.price.toFixed(0)}
                                            <span className="text-xs font-medium text-gray-400 ml-0.5">.{(product.price % 1).toFixed(2).slice(2)}</span>
                                        </span>
                                    </div>

                                    {/* Edit button — pill style matching user "Add to Bag" */}
                                    <button
                                        onClick={() => handleOpenEditModal(product)}
                                        className="w-full py-2 rounded-full text-[11px] font-semibold transition-all duration-200 hover:shadow-md"
                                        style={{
                                            background: 'rgba(255,255,255,0.7)',
                                            border: '1px solid rgba(216,180,254,0.6)',
                                            color: '#6b21a8',
                                        }}
                                    >
                                        Edit Product
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.7)' }}>
                                    {['Product','Brand','Status','Stock','Price',''].map((h, i) => (
                                        <th key={i} className={`px-6 py-4 text-[10px] font-black text-purple-400 ${i>=4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50">
                                {filtered.map(product => (
                                    <tr key={product.id} className="group hover:bg-purple-50/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-xl bg-gray-50 border border-purple-100 flex-shrink-0 overflow-hidden">
                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-1" />
                                                </div>
                                                <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-purple-600 font-medium">{(!product.brandName || product.brandName === 'null') ? '—' : product.brandName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border flex items-center gap-1 w-fit ${
                                                product.is_active === false || product.status === 'draft'
                                                    ? 'bg-gray-800 text-white border-gray-700'
                                                    : 'bg-green-50 text-green-600 border-green-200'
                                            }`}>
                                                {(product.is_active === false || product.status === 'draft') && <EyeOff size={8} />}
                                                {product.is_active === false || product.status === 'draft' ? 'Hidden' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${product.stock_quantity>10 ? 'bg-purple-400' : product.stock_quantity>0 ? 'bg-orange-400' : 'bg-red-400'}`}
                                                        style={{ width: `${Math.min(100,(product.stock_quantity/50)*100)}%` }} />
                                                </div>
                                                <span className={`text-sm font-bold ${product.stock_quantity<=5 ? 'text-orange-500' : 'text-gray-700'}`}>{product.stock_quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">AED {product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditModal(product)} className="p-2 rounded-lg hover:bg-purple-100 text-gray-400 hover:text-purple-600 transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>

            {filtered.length === 0 && (
                <div className="min-h-[260px] bg-white rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3" style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
                    <Archive size={36} className="text-purple-200" />
                    <p className="text-gray-400 font-medium">No products found</p>
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={isEditMode ? 'Edit Product' : 'Add New Product'}
                size="max-w-7xl"
                noBodyPadding
            >
                <form onSubmit={handleSubmit} className="relative">
                    <div className="p-8 lg:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* ── Left column ── */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Basic info */}
                            <section>
                                <p className={SECTION_TITLE}><span className="w-6 h-px bg-purple-300 inline-block" />Basic Info</p>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className={LABEL_CLS}>Product Name</label>
                                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange}
                                            placeholder="Enter product name…" className={FIELD_CLS} required disabled={isSubmitting} />
                                    </div>
                                    <div>
                                        <label htmlFor="description" className={LABEL_CLS}>Short Description</label>
                                        <AutoResizeTextarea name="description" id="description" value={formData.description} onChange={handleChange}
                                            rows={2} placeholder="Brief summary…" className={FIELD_CLS} required disabled={isSubmitting} />
                                    </div>
                                </div>
                            </section>

                            {/* Details */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className={SECTION_TITLE}><span className="w-6 h-px bg-purple-300 inline-block" />Details</p>
                                    <div>
                                        <label htmlFor="benefits" className={LABEL_CLS}>Benefits</label>
                                        <textarea name="benefits" id="benefits" value={formData.benefits} onChange={handleChange} rows={2} className={`${FIELD_CLS} resize-y min-h-[80px]`} disabled={isSubmitting} />
                                    </div>
                                    <div>
                                        <label htmlFor="how_to_use" className={LABEL_CLS}>How to Use</label>
                                        <textarea name="how_to_use" id="how_to_use" value={formData.how_to_use} onChange={handleChange} rows={2} className={`${FIELD_CLS} resize-y min-h-[80px]`} disabled={isSubmitting} />
                                    </div>
                                    <div>
                                        <label htmlFor="how_to_use_video" className={LABEL_CLS}>
                                            <span className="flex items-center gap-1.5"><Video size={11} /> How to Use — Video URL</span>
                                        </label>
                                        <input
                                            type="url"
                                            name="how_to_use_video"
                                            id="how_to_use_video"
                                            value={formData.how_to_use_video}
                                            onChange={handleChange}
                                            placeholder="https://res.cloudinary.com/…/video.mp4"
                                            className={FIELD_CLS}
                                            disabled={isSubmitting}
                                        />
                                        {formData.how_to_use_video && (
                                            <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(216,180,254,0.4)' }}>
                                                <video
                                                    src={formData.how_to_use_video}
                                                    controls
                                                    className="w-full max-h-48 object-contain bg-black"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className={SECTION_TITLE}><span className="w-6 h-px bg-purple-300 inline-block" />Ingredients</p>
                                    <div>
                                        <label htmlFor="ingredients" className={LABEL_CLS}>Ingredient List</label>
                                        <textarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} rows={2} className={`${FIELD_CLS} resize-y min-h-[80px]`} disabled={isSubmitting} />
                                    </div>
                                </div>
                            </section>

                            {/* Images */}
                            <section>
                                <p className={SECTION_TITLE}><span className="w-6 h-px bg-purple-300 inline-block" />Images</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-3">
                                        <label className={LABEL_CLS}>Main Image</label>
                                        <div className="relative aspect-square rounded-2xl bg-gray-50 border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50/30 transition-colors"
                                            style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
                                            {imageFile ? (
                                                <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-contain p-6" />
                                            ) : editingProduct?.imageUrl ? (
                                                <Image src={editingProduct.imageUrl} alt="Current" fill className="object-contain p-6" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-300">
                                                    <Plus size={28} />
                                                    <span className="text-xs font-semibold">Select image</span>
                                                </div>
                                            )}
                                            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isSubmitting} />
                                        </div>
                                        <div>
                                            <label htmlFor="altText" className={LABEL_CLS}>Alt Text</label>
                                            <input type="text" name="altText" id="altText" value={formData.altText} onChange={handleChange}
                                                placeholder="Image description for SEO…" className={FIELD_CLS} disabled={isSubmitting} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="rounded-xl p-5 space-y-2.5" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(216,180,254,0.3)' }}>
                                            <p className="text-[11px] font-bold text-purple-600 mb-3">Image guidelines</p>
                                            {['Product centered in frame','Soft, uniform lighting','High resolution (2000×2000px)','PNG with transparency preferred'].map((t, i) => (
                                                <p key={i} className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-purple-300 shrink-0" />{t}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Gallery */}
                                <div className="space-y-3">
                                    <label className={LABEL_CLS}>Gallery Images</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {formData.additionalImages.map((img, i) => (
                                            <div key={`ex-${i}`} className="bg-white rounded-xl border p-2 space-y-2" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                                                <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden group/img">
                                                    <Image src={img.url} alt="" fill className="object-contain p-1" />
                                                    <button type="button" onClick={() => removeExistingAdditionalImage(img.url)}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                                <input type="text" value={img.alt||''} onChange={e => handleExistingAdditionalAltChange(img.url, e.target.value)}
                                                    placeholder="Alt text…" className="w-full text-[10px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-300" disabled={isSubmitting} />
                                            </div>
                                        ))}
                                        {additionalImageFiles.map((entry, i) => (
                                            <div key={`new-${i}`} className="bg-white rounded-xl border border-purple-200 p-2 space-y-2">
                                                <div className="relative aspect-square bg-purple-50/30 rounded-lg overflow-hidden group/img">
                                                    <Image src={URL.createObjectURL(entry.file)} alt="" fill className="object-contain p-1" />
                                                    <button type="button" onClick={() => removeNewAdditionalImage(i)}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                                <input type="text" value={entry.alt} onChange={e => handleNewAdditionalAltChange(i, e.target.value)}
                                                    placeholder="Alt text…" className="w-full text-[10px] bg-purple-50 border border-purple-100 rounded-lg px-2 py-1.5 focus:outline-none placeholder:text-purple-300" disabled={isSubmitting} />
                                            </div>
                                        ))}
                                        <div className="relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-gray-300 hover:bg-purple-50/20 hover:border-purple-300 transition-all cursor-pointer min-h-[120px]"
                                            style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
                                            <Plus size={20} />
                                            <span className="text-[10px] font-semibold mt-1.5">Add photo</span>
                                            <input type="file" multiple onChange={handleAdditionalFilesChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isSubmitting} />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* ── Right column ── */}
                        <div className="lg:col-span-4 space-y-5">

                            {/* Pricing */}
                            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(216,180,254,0.2)' }}>
                                    <p className="text-xs font-black text-gray-700 ">Pricing</p>
                                    <DollarSign size={14} className="text-gray-300" />
                                </div>
                                <div>
                                    <label htmlFor="price" className={LABEL_CLS}>Price (AED)</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">AED</span>
                                        <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01"
                                            className={FIELD_CLS + ' pl-12'} required disabled={isSubmitting} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="comparedprice" className={LABEL_CLS}>Compare-at Price (AED)</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">AED</span>
                                        <input type="number" name="comparedprice" id="comparedprice" value={formData.comparedprice} onChange={handleChange} step="0.01"
                                            className={FIELD_CLS + ' pl-12'} disabled={isSubmitting} />
                                    </div>
                                </div>
                            </div>

                            {/* Inventory */}
                            <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(216,180,254,0.2)' }}>
                                    <p className="text-xs font-black text-gray-700 ">Inventory</p>
                                    <Archive size={14} className="text-gray-300" />
                                </div>
                                <div>
                                    <label htmlFor="stock_quantity" className={LABEL_CLS}>Stock Quantity</label>
                                    <input type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleChange}
                                        className={FIELD_CLS} required disabled={isSubmitting} />
                                </div>
                            </div>

                            {/* Organization */}
                            <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'rgba(216,180,254,0.35)' }}>
                                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(216,180,254,0.2)' }}>
                                    <p className="text-xs font-black text-gray-700 ">Organization</p>
                                    <Filter size={14} className="text-gray-300" />
                                </div>

                                <div>
                                    <label htmlFor="brand" className={LABEL_CLS}>Brand</label>
                                    <select name="brand" id="brand" value={formData.brand} onChange={handleChange}
                                        className={FIELD_CLS} required disabled={isSubmitting}>
                                        <option value="">Select brand</option>
                                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="status" className={LABEL_CLS}>Status</label>
                                    <select name="status" id="status" value={formData.status} onChange={handleChange}
                                        className={FIELD_CLS} required disabled={isSubmitting}>
                                        <option value="active">Active</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="form" className={LABEL_CLS}>Form</label>
                                    <input type="text" name="form" id="form" value={formData.form} onChange={handleChange}
                                        placeholder="e.g. Cream, Spray, Serum…" className={FIELD_CLS} disabled={isSubmitting} />
                                </div>

                                <div>
                                    <label htmlFor="size" className={LABEL_CLS}>Size / Volume</label>
                                    <input type="text" name="size" id="size" value={formData.size} onChange={handleChange}
                                        placeholder="e.g. 50ml, 100g, 1.7 oz…" className={FIELD_CLS} disabled={isSubmitting} />
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>Categories</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {categories.map(c => (
                                            <label key={c.id} className="flex items-center gap-3 cursor-pointer group/c">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                    formData.categoryIds.includes(c.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-200 group-hover/c:border-purple-300'
                                                }`}>
                                                    {formData.categoryIds.includes(c.id) && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                                <input type="checkbox" checked={formData.categoryIds.includes(c.id)}
                                                    onChange={e => handleCategoryChange(c.id, e.target.checked)} className="sr-only" disabled={isSubmitting} />
                                                <span className={`text-sm font-medium transition-colors ${formData.categoryIds.includes(c.id) ? 'text-gray-900' : 'text-gray-400 group-hover/c:text-gray-600'}`}>{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>Skin Concerns</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        {concerns.map(con => (
                                            <label key={con.id} className="flex items-center gap-3 cursor-pointer group/con">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                    formData.concernIds.includes(con.id) ? 'bg-[#db2777] border-[#db2777]' : 'border-gray-200 group-hover/con:border-pink-300'
                                                }`}>
                                                    {formData.concernIds.includes(con.id) && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                                <input type="checkbox" checked={formData.concernIds.includes(con.id)}
                                                    onChange={e => handleConcernChange(con.id, e.target.checked)} className="sr-only" disabled={isSubmitting} />
                                                <span className={`text-sm font-medium transition-colors ${formData.concernIds.includes(con.id) ? 'text-gray-900' : 'text-gray-400 group-hover/con:text-gray-600'}`}>{con.name}</span>
                                            </label>
                                        ))}
                                        {concerns.length === 0 && <p className="text-xs text-gray-400 italic">No concerns defined.</p>}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 left-0 right-0 px-8 py-5 bg-white/95 backdrop-blur-sm border-t border-purple-100 flex flex-row-reverse items-center gap-4 z-50">
                    <button type="submit" disabled={isSubmitting}
                        className="px-10 py-4 text-white text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 min-w-[200px]"
                        style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 20px rgba(152,105,247,0.3)' }}>
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isEditMode ? 'Update Product' : 'Save Product'}
                    </button>
                    <button type="button" onClick={handleCloseModal} disabled={isSubmitting}
                        className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors px-4">
                        Cancel
                    </button>
                </div>
            </form>
            </Modal>
        </div>
    );
};

export default ManageProducts;
