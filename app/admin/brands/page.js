'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, Loader2, Heart, MoreHorizontal, Award, Sparkles, LayoutGrid, Globe, ExternalLink } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const ManageBrands = () => {
    const { brands, addBrand, updateBrand, deleteBrand, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const initialFormData = useMemo(() => ({ name: '', logoUrl: '' }), []);
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (isModalOpen) {
            setFormData(editingBrand ? { name: editingBrand.name, logoUrl: editingBrand.logoUrl || '' } : initialFormData);
        }
    }, [isModalOpen, editingBrand, initialFormData]);

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
    };
    
    const handleDelete = (brandId) => {
        if(window.confirm('Are you sure you want to delete this maison? This will affect its cataloged masterpieces.')) {
            deleteBrand(brandId);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        
        const brandData = new FormData();
        brandData.append('name', formData.name);
        brandData.append('logoUrl', formData.logoUrl);

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

    if (isDataLoading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Identifying Partner Maisons...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-10 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Partner Maisons</h2>
                    <p className="text-sm text-gray-400 mt-1">Curating {brands.length} luxury houses in the Naya Lumière collection</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search maison..."
                            className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Button 
                        onClick={handleOpenAddModal} 
                        className="bg-gray-900 hover:bg-indigo-600 text-white rounded-xl px-6 py-6 text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Affiliate New Maison
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
                            className="group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white duration-500 shadow-inner">
                                        <Award size={32} strokeWidth={1.5} />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-all">
                                                <MoreHorizontal className="h-5 w-5 text-gray-300" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                                            <DropdownMenuItem onClick={() => handleOpenEditModal(brand)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                                                <Edit size={16} className="text-indigo-600" /> Refine Identity
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(brand.id)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
                                                <Trash2 size={16} /> Sever Affiliation
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors duration-500">{brand.name}</h3>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                        <Sparkles size={12} className="text-indigo-400" />
                                        Verified Partner Maison
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Market Presence</span>
                                        <span className="text-sm font-bold text-gray-900">Global Elite</span>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-300 italic">
                                                {['FR', 'CH', 'IT'][i]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-auto bg-gray-50/50 p-4 border-t border-gray-50 flex items-center justify-center">
                                <button onClick={() => handleOpenEditModal(brand)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-2 group/btn">
                                    Manage Dossier
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

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBrand ? 'Refine Maison Identity' : 'Affiliate New Maison'} size="max-w-2xl">
                <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
                    <div className="space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-2 flex items-center gap-3">
                            <span className="w-10 h-px bg-indigo-600/20"></span>
                            House Registry
                        </h3>
                        
                        <div className="group">
                            <label htmlFor="name" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 transition-colors group-focus-within:text-indigo-600">Maison Name</label>
                            <input
                                type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                                placeholder="e.g., L'Art de la Peau"
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:bg-white transition-all text-lg shadow-inner"
                                required disabled={isSubmitting}
                            />
                        </div>

                        <div className="group">
                            <label htmlFor="logoUrl" className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Global Portal (Logo URL / Optional)</label>
                            <div className="relative">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="text" id="logoUrl" name="logoUrl" value={formData.logoUrl} onChange={handleChange}
                                    placeholder="https://maison-essence.fr/logo.svg"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-16 pr-6 py-4 font-medium text-gray-600 focus:bg-white transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

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
                            disabled={isSubmitting} 
                            className="px-10 py-6 bg-indigo-600 hover:bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : editingBrand ? 'Update Affiliation' : 'Seal Affiliation'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageBrands;