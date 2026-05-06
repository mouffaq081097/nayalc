'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, Loader2, Heart, MoreHorizontal, Award, Sparkles, LayoutGrid, Globe, ExternalLink, EyeOff, Eye, Image as ImageIcon } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
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
        <div className="space-y-10 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 ">Brands</h2>
                    <p className="text-sm text-gray-400 mt-1">{brands.length} brand{brands.length !== 1 ? 's' : ''} in the Naya Lumière collection</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search maison..."
                            className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cl-purple/20 focus:border-cl-purple transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Button
                        onClick={handleOpenAddModal}
                        className="bg-gray-900 hover:bg-cl-purple text-white rounded-xl px-6 py-6 text-[11px] font-black   shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Brand
                    </Button>
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
                <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
                    <Award size={40} className="text-gray-200" />
                    <p className="text-lg font-medium text-gray-400 italic">No maison records match your query.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBrand ? 'Edit Brand' : 'Add Brand'} size="max-w-2xl">
                <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black   text-cl-purple mb-2 flex items-center gap-3">
                            <span className="w-10 h-px bg-cl-purple/20"></span>
                            Brand Info
                        </h3>

                        <div className="group">
                            <label htmlFor="name" className="block text-[11px] font-black text-gray-400   mb-3 transition-colors group-focus-within:text-cl-purple">Brand Name</label>
                            <input
                                type="text" id="name" name="name" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                placeholder="e.g., GERnétic"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:bg-white transition-all text-lg shadow-inner"
                                required disabled={isSubmitting}
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="logo" className="block text-[11px] font-black text-gray-400   mb-3">Brand Logo</label>
                            <div className="relative group/img aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden p-6 transition-all hover:bg-gray-100/50 relative">
                                {imageFile ? (
                                    <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-contain p-2" />
                                ) : editingBrand?.imageurl ? (
                                    <Image src={editingBrand.imageurl} alt="Current" fill className="object-contain p-2" />
                                ) : (
                                    <div className="text-gray-200 flex flex-col items-center gap-2">
                                        <ImageIcon size={32} />
                                        <span className="text-[9px] font-black  ">Select Image</span>
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
                    </div>

                    <div className="pt-8 border-t border-gray-50 flex justify-end gap-6">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-8 py-4 text-[10px] font-black   text-gray-400 hover:text-gray-900 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-10 py-6 bg-cl-purple hover:bg-gray-900 text-white rounded-xl text-[11px] font-black   shadow-xl active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : editingBrand ? 'Update Brand' : 'Add Brand'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageBrands;
