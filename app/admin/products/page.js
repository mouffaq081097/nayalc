'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';

const ManageProducts = () => {
    const { products, categories, brands, addProduct, updateProduct, deleteProduct, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const isEditMode = !!editingProduct;
    const [imageFile, setImageFile] = useState(null);

    const getInitialFormData = useCallback((product) => {
        return {
            name: product?.name || '',
            description: product?.description || '',
            price: product?.price || 0,
            stock_quantity: product?.stock_quantity || 0,
            categoryIds: product?.categories?.map(cat => cat.id) || [],
            brand: product?.brandName || '',
            imageUrl: product?.imageUrl || '',
            additionalImages: product?.additionalImages || [],
            comparedprice: product?.comparedprice || 0,
            ingredients: product?.ingredients || '',
            long_description: product?.long_description || '',
            benefits: product?.benefits || '',
            how_to_use: product?.how_to_use || '',
            status: product?.status || 'active',
        };
    }, []);
    
    const [formData, setFormData] = useState(getInitialFormData);

    useEffect(() => {
        if (isEditMode) {
            setFormData(getInitialFormData(editingProduct));
        } else {
            setFormData(getInitialFormData(null));
        }
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
                if (Array.isArray(finalProductData[key])) {
                    finalProductData[key].forEach(item => productFormData.append(key, item));
                } else {
                    productFormData.append(key, finalProductData[key]);
                }
            }

            if (imageFile) {
                productFormData.append('mainImage', imageFile);
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

    if (isDataLoading) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Products</h1>
                <button onClick={handleOpenAddModal} className="bg-brand-button-bg text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center space-x-2">
                    <Plus name="plus" className="w-5 h-5" />
                    <span>Add Product</span>
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Image src={product.imageUrl} alt={product.name} width={48} height={48} objectFit="contain" className="rounded-md" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal max-w-xs text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoryNames}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.brandName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">AED {product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex justify-center space-x-3">
                                            <button onClick={() => handleOpenEditModal(product)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Edit Product' : 'Add Product'}>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">General Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="long_description" className="block text-sm font-medium text-gray-700">Long Description</label>
                                <textarea name="long_description" id="long_description" value={formData.long_description} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">Benefits</label>
                                <textarea name="benefits" id="benefits" value={formData.benefits} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="how_to_use" className="block text-sm font-medium text-gray-700">How to Use</label>
                                <textarea name="how_to_use" id="how_to_use" value={formData.how_to_use} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
                                <textarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="comparedprice" className="block text-sm font-medium text-gray-700">Compared at Price</label>
                                <input type="number" name="comparedprice" id="comparedprice" value={formData.comparedprice} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                <input type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting}>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                                <select name="brand" id="brand" value={formData.brand} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting}>
                                    <option value="">Select a brand</option>
                                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categories</label>
                                <div className="mt-1 grid grid-cols-2 gap-2">
                                    {categories.map(c => (
                                        <div key={c.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`category-${c.id}`}
                                                name="categoryIds"
                                                value={c.id}
                                                checked={formData.categoryIds.includes(c.id)}
                                                onChange={(e) => handleCategoryChange(c.id, e.target.checked)}
                                                className="h-4 w-4 text-brand-pink border-gray-300 rounded focus:ring-brand-pink"
                                                disabled={isSubmitting}
                                            />
                                            <label htmlFor={`category-${c.id}`} className="ml-2 text-sm text-gray-700">{c.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image</label>
                            <input type="file" name="image" id="image" onChange={handleFileChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-4 flex justify-end space-x-2">
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

export default ManageProducts;