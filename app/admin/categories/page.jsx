'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Trash2, Search, Loader2, Tag, MoreHorizontal } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const ManageCategories = () => {
    const { categories, addCategory, updateCategory, deleteCategory, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            setCategoryName(editingCategory ? editingCategory.name : '');
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
        if (window.confirm('Are you sure you want to delete this category? This might affect existing products.')) {
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
            formData.append('description', editingCategory?.description || 'A new category.');

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (editingCategory && editingCategory.image_url) {
                formData.append('image_url', editingCategory.image_url);
            } else if (editingCategory && !editingCategory.image_url && !imageFile) {
                formData.append('image_url', '');
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
                        placeholder="Search by category name..."
                        className="pl-10 pr-4 py-2 border rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleOpenAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add New Category
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> {/* Changed gap-8 to gap-4 */}
                {filteredCategories.map(category => (
                    <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                        <div className="p-6" onClick={() => handleOpenEditModal(category)}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-indigo-100 p-3 rounded-full">
                                        <Tag className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{category.name}</p>
                                        <p className="text-sm text-gray-500">{category.productsCount} products</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}>
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

            {filteredCategories.length === 0 && (
                <div className="text-center mt-10">
                    <p className="text-xl text-gray-500">No categories found.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
                        <input
                            type="text"
                            id="categoryName"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700">Category Image</label>
                        <input type="file" name="image" id="image" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" disabled={isSubmitting} />
                        {editingCategory?.image_url && (
                            <p className="mt-2 text-sm text-gray-500">Current Image: <a href={`/uploads/${editingCategory.image_url}`} target="_blank" rel="noopener noreferrer">{editingCategory.image_url.split('/').pop()}</a></p>
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
                    <div className="pt-6 flex justify-end space-x-4">
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

export default ManageCategories;