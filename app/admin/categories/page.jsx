'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Trash2, Search, Loader2, Tag, MoreHorizontal, LayoutGrid, Package, ArrowRight, ExternalLink, Image as ImageIcon, CheckCircle2, Edit } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ManageCategories = () => {
    const { categories, addCategory, updateCategory, deleteCategory, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categorySlug, setCategorySlug] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            setCategoryName(editingCategory ? editingCategory.name : '');
            setCategorySlug(editingCategory ? editingCategory.slug : '');
            setImageFile(null);
        }
    }, [isModalOpen, editingCategory]);

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
        setCategoryProducts([]);
    };

    const handleOpenEditModal = async (category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
        try {
            const response = await fetch(`/api/categories/${category.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch category details.');
            }
            const data = await response.json();
            setCategoryProducts(data.products || []);
        } catch (error) {
            console.error("Error fetching category products:", error);
            setCategoryProducts([]);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setImageFile(null);
        setCategoryProducts([]);
    };

    const handleDelete = (categoryId) => {
        if (window.confirm('Are you sure you want to delete this universe? This will detach all associated products.')) {
            deleteCategory(categoryId);
        }
    }

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', categoryName);
            formData.append('slug', categorySlug);
            formData.append('description', editingCategory?.description || 'A curated universe of beauty.');

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (editingCategory && editingCategory.image_url) {
                formData.append('image_url', editingCategory.image_url);
            }

            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
            } else {
                await addCategory(formData);
            }

            handleCloseModal();
        } catch (error) {
            console.error("Failed to save category", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isDataLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Organizing Universes...</p>
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
                        placeholder="Search category universes..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <Button 
                    onClick={handleOpenAddModal} 
                    className="bg-gray-900 hover:bg-indigo-600 text-white rounded-xl px-6 py-6 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-95 transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create New Universe
                </Button>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredCategories.map(category => (
                        <div 
                            key={category.id} 
                            className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
                        >
                            <div 
                                className="relative aspect-[4/3] w-full p-6 bg-gray-50/50 cursor-pointer group-hover:bg-white transition-colors duration-500"
                                onClick={() => handleOpenEditModal(category)}
                            >
                                {category.imageUrl ? (
                                    <Image 
                                        src={category.imageUrl} 
                                        alt={category.name} 
                                        fill 
                                        className="object-cover p-2 rounded-2xl transition-transform duration-700 group-hover:scale-105" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-3 bg-white rounded-2xl border border-gray-50">
                                        <ImageIcon size={40} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Portrait</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                                <div className="flex-grow space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                            {category.name}
                                        </h3>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-all">
                                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                                                <DropdownMenuItem onClick={() => handleOpenEditModal(category)} className="rounded-lg px-3 py-2 text-sm font-medium gap-2">
                                                    <Edit size={14} className="text-indigo-600" /> Refine
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(category.id)} className="rounded-lg px-3 py-2 text-sm font-medium gap-2 text-red-600">
                                                    <Trash2 size={14} /> Dissolve
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Package size={10} className="text-indigo-600/40" />
                                        {category.productsCount || 0} Products Cataloged
                                    </p>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <button 
                                        onClick={() => handleOpenEditModal(category)}
                                        className="w-full py-3 bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3"
                                    >
                                        Manage Assets
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {filteredCategories.length === 0 && (
                <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                    <Tag size={40} className="text-gray-200" />
                    <p className="text-lg font-medium text-gray-400 italic">No universes discovered in the archives.</p>
                </div>
            )}

            <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                title={editingCategory ? 'Universe Architecture' : 'Incept New Universe'}
                size="max-w-4xl"
                noBodyPadding
            >
                <form onSubmit={handleSubmit} className="p-10 lg:p-14 space-y-12">
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                                    <span className="w-10 h-px bg-indigo-600/20"></span>
                                    Identity
                                </h3>
                                <div>
                                    <label htmlFor="categoryName" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Classification Name</label>
                                    <input
                                        type="text" id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                                        placeholder="e.g., Cellular Regimes"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:bg-white transition-all text-lg shadow-inner"
                                        required disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="categorySlug" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">URL Path (Slug)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">/</span>
                                        <input
                                            type="text" id="categorySlug" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}
                                            placeholder="skincare-regimes"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-6 py-4 font-medium text-indigo-600 focus:bg-white transition-all text-sm shadow-inner"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <p className="mt-2 text-[9px] text-gray-400 italic">Leave blank to automatically derive from name.</p>
                                </div>
                                <div>
                                    <label htmlFor="image" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Visual Anchor (Portrait)</label>
                                    <div className="relative group/img aspect-[16/9] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden p-6 transition-all hover:bg-gray-100/50">
                                        {imageFile ? (
                                            <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-cover p-2 rounded-xl" />
                                        ) : editingCategory?.imageUrl ? (
                                            <Image src={editingCategory.imageUrl} alt="Current" fill className="object-cover p-2 rounded-xl" />
                                        ) : (
                                            <div className="text-gray-200 flex flex-col items-center gap-2">
                                                <ImageIcon size={32} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Select Image</span>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isSubmitting} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                                    <span className="w-10 h-px bg-indigo-600/20"></span>
                                    Linked Assets
                                </h3>
                                <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-8">
                                    {editingCategory ? (
                                        <div className="space-y-6">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Masterpieces in Universe</p>
                                            {categoryProducts.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                                    {categoryProducts.map(product => (
                                                        <div key={product.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-50 p-1">
                                                                <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                                            </div>
                                                            <div className="flex-grow">
                                                                <p className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                                                                <p className="text-[9px] text-indigo-600 font-medium tracking-tighter">Verified Inclusion</p>
                                                            </div>
                                                            <CheckCircle2 size={14} className="text-green-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-3">
                                                    <Package size={32} strokeWidth={1} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest italic text-center">No products currently <br/>assigned to this universe.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-14 text-gray-300 gap-4 text-center">
                                            <LayoutGrid size={40} strokeWidth={1} />
                                            <p className="text-sm font-medium italic">Universe must be incepted before <br/>masterpieces can be linked.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <div className="pt-8 border-t border-gray-50 flex justify-end gap-6">
                            <button 
                                type="button" 
                                onClick={handleCloseModal} 
                                className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel Operation
                            </button>
                            <Button 
                                type="submit" 
                                className="px-10 py-6 bg-indigo-600 hover:bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : editingCategory ? 'Update Architecture' : 'Incept Universe'}
                            </Button>
                                                </div>
                                            </form>
                                        </Modal>
                                    </div>
                                );
                            };
export default ManageCategories;