'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';

const ManageCategories = () => {
    const { categories, addCategory, updateCategory, deleteCategory, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);

    useEffect(() => {
        if (isModalOpen) {
            setCategoryName(editingCategory ? editingCategory.name : '');
            setImageFile(null); // Clear image file on modal open
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/${category.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch category details.');
            }
            const data = await response.json();
            setCategoryProducts(data.products || []);
        } catch (error) {
            console.error("Error fetching category products:", error);
            setCategoryProducts([]); // Reset on error
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setImageFile(null);
        setCategoryProducts([]);
    };

    const handleDelete = (categoryId) => {
        if(window.confirm('Are you sure you want to delete this category? This might affect existing products.')) {
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
            // Add description if needed, currently hardcoded in AppContext
            formData.append('description', editingCategory?.description || 'A new category.'); // Ensure description is sent

            if (imageFile) {
                formData.append('image', imageFile); // 'image' matches multer field name in categories.js
            } else if (editingCategory && editingCategory.image_url) {
                // If no new file, but there's an existing image, send its URL to retain it
                // This assumes backend handles image_url in body for PUT if no file
                // Or, if image_url is empty string, it means clear the image
                formData.append('image_url', editingCategory.image_url);
            } else if (editingCategory && !editingCategory.image_url && !imageFile) {
                // If editing and no current image and no new image, explicitly send empty string to clear
                formData.append('image_url', '');
            }


            if (editingCategory) {
                const updatedCategory = await updateCategory(editingCategory.id, formData);
                addToast(`Category ${updatedCategory.name} updated successfully!`);
            } else {
                await addCategory(formData);
            }

            handleCloseModal();
        } catch(error) {
            console.error("Failed to save category", error);
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
                <h1 className="text-3xl font-bold text-gray-800">Manage Categories</h1>
                <button onClick={handleOpenAddModal} className="bg-brand-button-bg text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center space-x-2">
                    <Plus name="plus" className="w-5 h-5" />
                    <span>Add Category</span>
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map(category => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.productsCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex justify-center space-x-3">
                                            <button onClick={() => handleOpenEditModal(category)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
                        <input
                            type="text"
                            id="categoryName"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700">Category Image</label>
                        <input type="file" name="image" id="image" onChange={handleFileChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-pink focus:border-brand-pink" disabled={isSubmitting} />
                        {editingCategory?.image_url && (
                            <p className="mt-2 text-sm text-gray-500">Current Image: <a href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${editingCategory.image_url}`} target="_blank" rel="noopener noreferrer">{editingCategory.image_url.split('/').pop()}</a></p>
                        )}
                    </div>
                    {editingCategory && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mt-4">Products in this Category</h3>
                            {categoryProducts.length > 0 ? (
                                <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                                    {categoryProducts.map(product => (
                                        <li key={product.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                            <div className="w-0 flex-1 flex items-center">
                                                <span className="ml-2 flex-1 w-0 truncate">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 text-sm text-gray-500">No products in this category.</p>
                            )}
                        </div>
                    )}
                    <div className="pt-6 flex justify-end space-x-2">
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

export default ManageCategories;