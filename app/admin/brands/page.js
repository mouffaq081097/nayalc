'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, Loader2, Heart, MoreHorizontal } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

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
        if(window.confirm('Are you sure you want to delete this brand? This might affect existing products.')) {
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
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by brand name..."
                        className="pl-10 pr-4 py-2 border rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleOpenAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add New Brand
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredBrands.map(brand => (
                    <div key={brand.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-indigo-100 p-3 rounded-full">
                                        <Heart className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{brand.name}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleOpenEditModal(brand)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(brand.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBrands.length === 0 && (
                <div className="text-center mt-10">
                    <p className="text-xl text-gray-500">No brands found.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBrand ? 'Edit Brand' : 'Add Brand'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Brand Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                     <div>
                        <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">Logo URL (Optional)</label>
                        <input
                            type="text"
                            id="logoUrl"
                            name="logoUrl"
                            value={formData.logoUrl}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting} className="px-6 py-3">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageBrands;