'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';

const ManageBrands = () => {
    const { brands, addBrand, updateBrand, deleteBrand, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    
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

    if (isDataLoading) {
        return <div>Loading...</div>
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Brands</h1>
                <button onClick={handleOpenAddModal} className="bg-brand-button-bg text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center space-x-2">
                    <Plus name="plus" className="w-5 h-5" />
                    <span>Add Brand</span>
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {brands.map(brand => (
                                <tr key={brand.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{brand.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex justify-center space-x-3">
                                            <button onClick={() => handleOpenEditModal(brand)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(brand.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBrand ? 'Edit Brand' : 'Add Brand'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Brand Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-button-bg border border-transparent rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageBrands;