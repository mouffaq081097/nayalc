'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, Loader2, Package, MoreHorizontal, LayoutGrid, List, Filter, ExternalLink, Archive, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import AutoResizeTextarea from '../../components/AutoResizeTextarea';
import ProductListItem from '../../components/ProductListItem';
import { truncateText } from '@/app/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const ManageProducts = () => {
    const { products, categories, brands, addProduct, updateProduct, deleteProduct, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const isEditMode = !!editingProduct;
    const [imageFile, setImageFile] = useState(null);
    const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const getInitialFormData = useCallback((product) => {
        return {
            name: product?.name || '',
            description: product?.description || '',
            price: product?.price || 0,
            stock_quantity: product?.stock_quantity || 0,
            categoryIds: product?.category_ids || product?.categories?.map(cat => cat.id) || [],
            brand: product?.brandName || '',
            imageUrl: product?.imageUrl || '',
            altText: product?.altText || '',
            additionalImages: product?.additionalImagesData || [], // Expecting objects with url and alt
            comparedprice: product?.comparedprice || 0,
            ingredients: product?.ingredients || '',
            long_description: product?.long_description || '',
            benefits: product?.benefits || '',
            how_to_use: product?.how_to_use || '',
            status: product?.status || 'active',
        };
    }, []);
    
    const [formData, setFormData] = useState(() => getInitialFormData(null));

    useEffect(() => {
        if (isEditMode) {
            setFormData(getInitialFormData(editingProduct));
        } else {
            setFormData(getInitialFormData(null));
        }
        setAdditionalImageFiles([]);
    }, [isEditMode, editingProduct, getInitialFormData]);
    
    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleDelete = (productId) => {
        if(window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(productId);
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setImageFile(null);
        setAdditionalImageFiles([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock_quantity' || name === 'comparedprice' ? parseFloat(value) : value }));
    };

    const handleCategoryChange = (categoryId, isChecked) => {
        setFormData(prev => {
            const currentCategoryIds = prev.categoryIds || [];
            if (isChecked) {
                return { ...prev, categoryIds: [...currentCategoryIds, categoryId] };
            } else {
                return { ...prev, categoryIds: currentCategoryIds.filter(id => id !== categoryId) };
            }
        });
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleAdditionalFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const newEntries = files.map(file => ({ file, alt: '' }));
        setAdditionalImageFiles(prev => [...prev, ...newEntries]);
    };

    const handleNewAdditionalAltChange = (index, alt) => {
        setAdditionalImageFiles(prev => {
            const next = [...prev];
            next[index] = { ...next[index], alt };
            return next;
        });
    };

    const handleExistingAdditionalAltChange = (url, alt) => {
        setFormData(prev => ({
            ...prev,
            additionalImages: prev.additionalImages.map(img => 
                img.url === url ? { ...img, alt } : img
            )
        }));
    };

    const removeNewAdditionalImage = (index) => {
        setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAdditionalImage = (imageUrl) => {
        setFormData(prev => ({
            ...prev,
            additionalImages: prev.additionalImages.filter(img => img.url !== imageUrl)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const brand = brands.find(b => b.name === formData.brand);

            const finalProductData = {
                ...formData,
                brand_id: brand ? brand.id : null,
            };

            const productFormData = new FormData();
            for (const key in finalProductData) {
                if (key === 'additionalImages') {
                    // Send existing images that weren't removed, along with their potentially updated alt text
                    finalProductData[key].forEach(img => {
                        productFormData.append('existingAdditionalImages', img.url);
                        productFormData.append('existingAdditionalAlts', img.alt || '');
                    });
                } else if (Array.isArray(finalProductData[key])) {
                    finalProductData[key].forEach(item => productFormData.append(key, item));
                } else {
                    productFormData.append(key, finalProductData[key]);
                }
            }

            if (imageFile) {
                productFormData.append('mainImage', imageFile);
            }
            // Always send main alt text
            productFormData.append('mainAltText', formData.altText || '');

            if (additionalImageFiles.length > 0) {
                additionalImageFiles.forEach(entry => {
                    productFormData.append('additionalImages', entry.file);
                    productFormData.append('additionalAlts', entry.alt || '');
                });
            }

            if (editingProduct) {
                await updateProduct(editingProduct.id, productFormData);
            } else {
                await addProduct(productFormData);
            }

            handleCloseModal();
        } catch (error) {
            console.error("Failed to save product", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isDataLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Inventory Synchronizing...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div className="relative flex-grow max-w-xl">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search our selection..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                    
                    <Button 
                        onClick={handleOpenAddModal} 
                        className="bg-gray-900 hover:bg-indigo-600 text-white rounded-xl px-6 py-6 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-95 transition-all"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add New Masterpiece
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div 
                        key="grid"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredProducts.map(product => (
                            <div 
                                key={product.id} 
                                className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
                            >
                                {/* Status Badge Overlay */}
                                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm ${
                                        product.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                    }`}>
                                        {product.status}
                                    </span>
                                    {product.stock_quantity <= 5 && (
                                        <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-orange-50 text-orange-600 border border-orange-100 shadow-sm flex items-center gap-1">
                                            <AlertCircle size={10} />
                                            Low Stock
                                        </span>
                                    )}
                                </div>

                                <div 
                                    className="relative aspect-square w-full p-8 bg-gray-50/50 cursor-pointer group-hover:bg-white transition-colors duration-500"
                                    onClick={() => handleOpenEditModal(product)}
                                >
                                    <Image 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                        fill 
                                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-out" 
                                        sizes="300px" 
                                    />
                                </div>

                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="flex-grow space-y-2">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{product.brandName || 'Exclusive'}</p>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{truncateText(product.name, 45)}</h3>
                                        <p className="text-sm text-gray-400 font-medium line-clamp-2">{product.description}</p>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Price Point</span>
                                            <span className="text-xl font-black text-gray-900 tracking-tight">AED {product.price.toFixed(2)}</span>
                                        </div>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-10 h-10 rounded-xl hover:bg-gray-50 border border-gray-50 flex items-center justify-center transition-all">
                                                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-gray-100 p-2">
                                                <DropdownMenuItem onClick={() => handleOpenEditModal(product)} className="rounded-xl px-4 py-3 text-sm font-medium gap-3">
                                                    <Edit size={16} className="text-indigo-600" /> Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/product/${product.id}`, '_blank')} className="rounded-xl px-4 py-3 text-sm font-medium gap-3">
                                                    <ExternalLink size={16} className="text-blue-600" /> View Live
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(product.id)} className="rounded-xl px-4 py-3 text-sm font-medium gap-3 text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash2 size={16} /> Delete Product
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
                    >
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Masterpiece</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Market Value</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="relative w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 p-2 overflow-hidden shadow-sm">
                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-gray-900 leading-tight">{product.name}</p>
                                                    <p className="text-[11px] font-medium text-indigo-600 uppercase tracking-widest">{product.brandName || 'Naya Exclusive'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm text-gray-500 font-medium">Beauty & Wellness</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                                product.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${product.stock_quantity > 10 ? 'bg-indigo-500' : product.stock_quantity > 0 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(100, (product.stock_quantity / 50) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-bold ${product.stock_quantity <= 5 ? 'text-orange-600' : 'text-gray-900'}`}>{product.stock_quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-sm font-black text-gray-900">AED {product.price.toFixed(2)}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEditModal(product)} className="p-2.5 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 text-gray-400 hover:text-indigo-600 transition-all">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="p-2.5 rounded-xl hover:bg-red-50 hover:shadow-md border border-transparent hover:border-red-100 text-gray-400 hover:text-red-600 transition-all">
                                                    <Trash2 size={16} />
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

            {filteredProducts.length === 0 && (
                <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                    <Archive size={40} className="text-gray-200" />
                    <p className="text-lg font-medium text-gray-400 italic">No masterpieces found matching your criteria.</p>
                </div>
            )}

            {/* Modal - Elegant Redesign */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                title={editingProduct ? 'Refine Product' : 'Curate New Product'} 
                size="max-w-7xl"
                noBodyPadding
            >
                <form onSubmit={handleSubmit} className="p-10 lg:p-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            
                            {/* Left Content Column */}
                            <div className="lg:col-span-8 space-y-12">
                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-8 flex items-center gap-3">
                                        <span className="w-10 h-px bg-indigo-600/20"></span>
                                        Creative Essence
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label htmlFor="name" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-indigo-600">Product Title</label>
                                            <input 
                                                type="text" name="name" id="name" value={formData.name} onChange={handleChange} 
                                                placeholder="Enter a descriptive, elegant name..."
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all text-lg font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-300"
                                                required disabled={isSubmitting} 
                                            />
                                        </div>
                                        <div className="group">
                                            <label htmlFor="description" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-indigo-600">Elevator Pitch (Short Description)</label>
                                            <AutoResizeTextarea 
                                                name="description" id="description" value={formData.description} onChange={handleChange} rows={2} 
                                                placeholder="A concise summary of the product's allure..."
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all text-sm font-medium text-gray-600 leading-relaxed placeholder:font-normal placeholder:text-gray-300"
                                                required disabled={isSubmitting} 
                                            />
                                        </div>
                                        <div className="group">
                                            <label htmlFor="long_description" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-indigo-600">The Full Dossier (Long Description)</label>
                                            <AutoResizeTextarea 
                                                name="long_description" id="long_description" value={formData.long_description} onChange={handleChange} rows={6} 
                                                placeholder="Tell the full story of this product, from inspiration to results..."
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl px-6 py-6 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 transition-all text-sm font-medium text-gray-600 leading-relaxed placeholder:font-normal placeholder:text-gray-300"
                                                disabled={isSubmitting} 
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                                            <span className="w-10 h-px bg-indigo-600/20"></span>
                                            Botanical Rituals
                                        </h3>
                                        <div className="group">
                                            <label htmlFor="benefits" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Benefits & Efficacy</label>
                                            <AutoResizeTextarea name="benefits" id="benefits" value={formData.benefits} onChange={handleChange} rows={4} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 focus:bg-white transition-all text-sm text-gray-600" disabled={isSubmitting} />
                                        </div>
                                        <div className="group">
                                            <label htmlFor="how_to_use" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">The Ritual (How to Use)</label>
                                            <AutoResizeTextarea name="how_to_use" id="how_to_use" value={formData.how_to_use} onChange={handleChange} rows={4} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 focus:bg-white transition-all text-sm text-gray-600" disabled={isSubmitting} />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                                            <span className="w-10 h-px bg-indigo-600/20"></span>
                                            Alchemical Composition
                                        </h3>
                                        <div className="group">
                                            <label htmlFor="ingredients" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Ingredient Philosophy</label>
                                            <AutoResizeTextarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} rows={10} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 focus:bg-white transition-all text-sm text-gray-600 leading-relaxed" disabled={isSubmitting} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-8 flex items-center gap-3">
                                        <span className="w-10 h-px bg-indigo-600/20"></span>
                                        Visual Presentation
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                        <div className="relative group space-y-4">
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Master Portrait</label>
                                            <div className="relative aspect-square rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-100 overflow-hidden flex flex-col items-center justify-center p-6 transition-all group-hover:bg-gray-100/50 group-hover:border-indigo-100">
                                                {imageFile ? (
                                                    <Image src={URL.createObjectURL(imageFile)} alt="New preview" fill className="object-contain p-8" />
                                                ) : editingProduct?.imageUrl ? (
                                                    <Image src={editingProduct.imageUrl} alt="Current" fill className="object-contain p-8" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3 text-gray-300">
                                                        <Plus size={32} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Select Image</span>
                                                    </div>
                                                )}
                                                <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isSubmitting} />
                                            </div>
                                            <div className="group">
                                                <label htmlFor="altText" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">SEO Alt Text (Main)</label>
                                                <input 
                                                    type="text" name="altText" id="altText" value={formData.altText} onChange={handleChange} 
                                                    placeholder="Describe this image for search engines..."
                                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2 focus:bg-white transition-all text-xs font-medium text-gray-600"
                                                    disabled={isSubmitting} 
                                                />
                                            </div>
                                            <p className="mt-2 text-[10px] text-gray-400 italic text-center">Recommended: 2000x2000px, PNG with transparency</p>
                                        </div>
                                        <div className="flex flex-col justify-center gap-6">
                                            <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100/30">
                                                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                                                    <CheckCircle2 size={18} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">Image Standards</span>
                                                </div>
                                                <ul className="space-y-3">
                                                    {['Product centered in frame', 'Soft uniform lighting', 'High-resolution clarity', 'Color accuracy verified'].map((standard, i) => (
                                                        <li key={i} className="text-[11px] text-gray-500 font-medium flex items-center gap-3 italic">
                                                            <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
                                                            {standard}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Images Section */}
                                    <div className="space-y-6">
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Gallery Expansion (Additional Photos)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* Existing Additional Images */}
                                            {formData.additionalImages.map((img, index) => (
                                                <div key={`existing-${index}`} className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden group/img flex flex-col p-3 gap-3 shadow-sm">
                                                    <div className="relative aspect-square w-full bg-gray-50 rounded-xl overflow-hidden">
                                                        <Image src={img.url} alt={`Additional ${index}`} fill className="object-contain p-2" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeExistingAdditionalImage(img.url)}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg z-10"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={img.alt || ''} 
                                                        onChange={(e) => handleExistingAdditionalAltChange(img.url, e.target.value)}
                                                        placeholder="Gallery Alt Text"
                                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 text-[10px] font-medium text-gray-600 focus:bg-white transition-all"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            ))}

                                            {/* New Additional Images Preview */}
                                            {additionalImageFiles.map((entry, index) => (
                                                <div key={`new-${index}`} className="relative bg-white rounded-2xl border border-indigo-100 overflow-hidden group/img flex flex-col p-3 gap-3 shadow-md">
                                                    <div className="relative aspect-square w-full bg-indigo-50/30 rounded-xl overflow-hidden">
                                                        <Image src={URL.createObjectURL(entry.file)} alt={`New Additional ${index}`} fill className="object-contain p-2" />
                                                        <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeNewAdditionalImage(index)}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg z-10"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={entry.alt} 
                                                        onChange={(e) => handleNewAdditionalAltChange(index, e.target.value)}
                                                        placeholder="New Gallery Alt Text"
                                                        className="w-full bg-indigo-50/50 border border-indigo-100/50 rounded-lg px-3 py-2 text-[10px] font-medium text-indigo-600 focus:bg-white transition-all placeholder:text-indigo-300"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            ))}

                                            {/* Add Button */}
                                            <div className="relative aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:bg-gray-100/50 hover:border-indigo-100 transition-all cursor-pointer min-h-[200px]">
                                                <Plus size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Add Photo</span>
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    onChange={handleAdditionalFilesChange} 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    disabled={isSubmitting} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Organization Column */}
                            <div className="lg:col-span-4 space-y-10">
                                <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                                        Market Dynamics
                                        <DollarSign size={14} className="text-gray-300" />
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label htmlFor="price" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Base Price (AED)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-300">AED</span>
                                                <input 
                                                    type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" 
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-16 pr-6 py-4 font-black text-gray-900 focus:bg-white transition-all"
                                                    required disabled={isSubmitting} 
                                                />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label htmlFor="comparedprice" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Valuation (Original Price)</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-300">AED</span>
                                                <input 
                                                    type="number" name="comparedprice" id="comparedprice" value={formData.comparedprice} onChange={handleChange} step="0.01" 
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-16 pr-6 py-4 font-bold text-gray-400 focus:bg-white transition-all line-through"
                                                    disabled={isSubmitting} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                                        Stock Management
                                        <Archive size={14} className="text-gray-300" />
                                    </h3>
                                    <div className="group">
                                        <label htmlFor="stock_quantity" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Available Units</label>
                                        <input 
                                            type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleChange} 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-black text-gray-900 focus:bg-white transition-all"
                                            required disabled={isSubmitting} 
                                        />
                                    </div>
                                </section>

                                <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-8 border-b border-gray-50 pb-4 flex justify-between items-center">
                                        Categorization
                                        <Filter size={14} className="text-gray-300" />
                                    </h3>
                                    <div className="space-y-8">
                                        <div>
                                            <label htmlFor="brand" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Maison (Brand)</label>
                                            <select 
                                                name="brand" id="brand" value={formData.brand} onChange={handleChange} 
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:bg-white appearance-none cursor-pointer transition-all"
                                                required disabled={isSubmitting}
                                            >
                                                <option value="">Select a brand</option>
                                                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="status" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Inventory State</label>
                                            <select 
                                                name="status" id="status" value={formData.status} onChange={handleChange} 
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:bg-white appearance-none cursor-pointer transition-all"
                                                required disabled={isSubmitting}
                                            >
                                                <option value="active">Active Market</option>
                                                <option value="draft">Archived Dossier</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Universe (Categories)</label>
                                            <div className="space-y-3">
                                                {categories.map(c => (
                                                    <label key={c.id} className="flex items-center group/cat cursor-pointer">
                                                        <div className="relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.categoryIds.includes(c.id)}
                                                                onChange={(e) => handleCategoryChange(c.id, e.target.checked)}
                                                                className="sr-only"
                                                                disabled={isSubmitting}
                                                            />
                                                            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                                                                formData.categoryIds.includes(c.id) 
                                                                ? 'bg-indigo-600 border-indigo-600' 
                                                                : 'border-gray-100 bg-gray-50 group-hover/cat:border-indigo-200'
                                                            }`}>
                                                                {formData.categoryIds.includes(c.id) && <Plus size={14} className="text-white rotate-45" />}
                                                            </div>
                                                        </div>
                                                        <span className={`ml-4 text-[13px] font-bold transition-colors ${
                                                            formData.categoryIds.includes(c.id) ? 'text-gray-900' : 'text-gray-400 group-hover/cat:text-gray-600'
                                                        }`}>
                                                            {c.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-6">
                                    <Button 
                                        type="submit" 
                                        className="w-full py-8 bg-indigo-600 hover:bg-gray-900 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all" 
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                                <span>Finalizing...</span>
                                            </>
                                        ) : (
                                            editingProduct ? 'Update Selection' : 'Unveil Selection'
                                        )}
                                    </Button>
                                    <button 
                                        type="button" 
                                        onClick={handleCloseModal} 
                                        className="w-full mt-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Retract Submission
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </Modal>
            </div>
        );
    };

export default ManageProducts;