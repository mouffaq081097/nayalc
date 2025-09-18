'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import Modal from '../../components/Modal';

const ManageProducts = () => {
    const { products, categories, brands, addProduct, updateProduct, deleteProduct, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const getInitialFormData = () => ({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        categoryIds: [], // Changed from single category to array of IDs
        brand: brands[0]?.name || '',
    });
    
    const [formData, setFormData] = useState(getInitialFormData);

    useEffect(() => {
        if (isModalOpen) {
            if (editingProduct) {
                setFormData({
                    ...editingProduct,
                    categoryIds: editingProduct.categoryIds || [], // Ensure categoryIds is an array
                });
            } else {
                setFormData(getInitialFormData());
            }
        }
    }, [isModalOpen, editingProduct, categories, brands]);
    
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
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock_quantity' ? parseFloat(value) : value }));
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
                categoryIds: formData.categoryIds, // ADD THIS LINE
                brand_id: brand ? brand.id : null,
            };

            let productId;
            if (editingProduct) {
                const updatedProduct = await updateProduct({ ...finalProductData, id: editingProduct.id });
                productId = editingProduct.id;
            } else {
                const newProduct = await addProduct(finalProductData);
                productId = newProduct.productId;
            }

            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('productImage', imageFile);
                await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/${productId}/image`, {
                    method: 'POST',
                    body: imageFormData,
                });
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
                    <Icon name="plus" className="w-5 h-5" />
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
                                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-contain rounded-md" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.categoryNames}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.brandName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">AED {product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex justify-center space-x-3">
                                            <button onClick={() => handleOpenEditModal(product)} className="text-blue-600 hover:text-blue-900"><Icon name="edit" className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Icon name="delete" className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Edit Product' : 'Add Product'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                        <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                        <input type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting} />
                    </div>
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image</label>
                        <input type="file" name="image" id="image" onChange={handleFileChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
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
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                        <select name="brand" id="brand" value={formData.brand} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" required disabled={isSubmitting}>
                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
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

export default ManageProducts;