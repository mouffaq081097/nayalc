'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, Loader2, Heart, MoreHorizontal, Award, Sparkles, LayoutGrid, Globe, ExternalLink, EyeOff, Eye, Image as ImageIcon } from 'lucide-react';
import Modal from '../../components/Modal';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ManageBrands = () => {
    const { adminBrands: brands, addBrand, updateBrand, deleteBrand, toggleBrandStatus, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [brandName, setBrandName] = useState('');
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        if (isModalOpen) {
            setBrandName(editingBrand ? editingBrand.name : '');
            setImageFile(null);
        }
    }, [isModalOpen, editingBrand]);

    const handleOpenAddModal = () => {
        setEditingBrand(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (brand) => {
        setEditingBrand(brand);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
        setImageFile(null);
    };
    
    const handleDelete = (brandId) => {
        if(window.confirm('Are you sure you want to delete this brand?')) {
            deleteBrand(brandId);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!brandName.trim()) return;

        setIsSubmitting(true);
        
        const brandData = new FormData();
        brandData.append('name', brandName);
        brandData.append('status', editingBrand ? (editingBrand.is_active ? 'active' : 'inactive') : 'active');

        if (imageFile) {
            brandData.append('image', imageFile);
        }

        try {
            if (editingBrand) {
                await updateBrand(editingBrand.id, brandData);
            } else {
                await addBrand(brandData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save brand", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isDataLoading) return <PageLoader />;
    
    return (
        <div className="space-y-6 pb-8">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#3b0764' }}>Brands</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{brands.length} brand{brands.length !== 1 ? 's' : ''} in the collection</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-grow sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleOpenAddModal}
                        className="cl-gradient-btn gap-2 px-5 py-2.5 text-[11px] active:scale-[0.98] whitespace-nowrap"
                    >
                        <Plus size={14} /> Add Brand
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredBrands.map(brand => (
                        <motion.div
                            key={brand.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col ${brand.is_active === false ? 'opacity-60' : ''}`}
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 rounded-2xl bg-cl-bg-lavender border border-indigo-100/50 flex items-center justify-center text-cl-purple transition-colors group-hover:bg-cl-purple group-hover:text-white duration-500 shadow-inner overflow-hidden relative">
                                        {brand.imageurl ? (
                                            <Image src={brand.imageurl} alt={brand.name} fill className="object-contain p-2" />
                                        ) : (
                                            <Award size={32} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-all">
                                                <MoreHorizontal className="h-5 w-5 text-gray-300" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                                            <DropdownMenuItem onClick={() => handleOpenEditModal(brand)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                                                <Edit size={16} className="text-cl-purple" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => toggleBrandStatus(brand.id, brand.is_active === false)}
                                                className="rounded-lg px-4 py-3 text-sm font-medium gap-3"
                                            >
                                                {brand.is_active === false ? (
                                                    <><Eye size={16} className="text-green-500" /> Activate</>
                                                ) : (
                                                    <><EyeOff size={16} className="text-orange-500" /> Deactivate</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(brand.id)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
                                                <Trash2 size={16} /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900  group-hover:text-cl-purple transition-colors duration-500">{brand.name}</h3>
                                    <p className="text-[10px] font-black mt-2 flex items-center gap-2" style={{ color: brand.is_active === false ? '#9ca3af' : '#9333ea' }}>
                                        <Sparkles size={12} />
                                        {brand.is_active === false ? 'Inactive' : 'Active'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-auto bg-gray-50/50 p-4 border-t border-gray-50 flex items-center justify-center">
                                <button onClick={() => handleOpenEditModal(brand)} className="text-[10px] font-black   text-gray-400 hover:text-cl-purple transition-colors flex items-center gap-2 group/btn">
                                    Edit Brand
                                    <ExternalLink size={12} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredBrands.length === 0 && (
                <div className="min-h-[280px] bg-white rounded-2xl border border-dashed border-purple-100 flex flex-col items-center justify-center gap-3">
                    <Award size={36} className="text-purple-200" />
                    <p className="text-sm font-medium text-gray-400">{searchTerm ? 'No brands match your search.' : 'No brands yet.'}</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBrand ? 'Edit Brand' : 'Add Brand'} size="max-w-2xl">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="group">
                        <label htmlFor="name" className="block text-xs font-medium text-purple-400 mb-2 transition-colors group-focus-within:text-purple-600">Brand name</label>
                        <input
                            type="text" id="name" name="name" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                            placeholder="e.g., GERnétic"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-semibold text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all text-base"
                            required disabled={isSubmitting}
                        />
                    </div>

                    <div className="group">
                        <label htmlFor="logo" className="block text-xs font-medium text-purple-400 mb-2">Brand logo</label>
                        <div className="relative aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-purple-100 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-purple-50/30 hover:border-purple-200 cursor-pointer">
                            {imageFile ? (
                                <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-contain p-2" />
                            ) : editingBrand?.imageurl ? (
                                <Image src={editingBrand.imageurl} alt="Current" fill className="object-contain p-2" />
                            ) : (
                                <div className="text-purple-200 flex flex-col items-center gap-2">
                                    <ImageIcon size={28} />
                                    <span className="text-xs font-medium text-gray-400">Click to select image</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="cl-gradient-btn gap-2 px-6 py-2.5 text-[11px] active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <><Loader2 size={15} className="animate-spin" /> Saving...</>
                            ) : editingBrand ? 'Update brand' : 'Add brand'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageBrands;
