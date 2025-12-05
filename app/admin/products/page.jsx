'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, Loader2, Package, MoreHorizontal } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import AutoResizeTextarea from '../../components/AutoResizeTextarea';
import ProductListItem from '../../components/ProductListItem';
import { truncateText } from '@/app/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const ManageProducts = () => {
    const { products, categories, brands, addProduct, updateProduct, deleteProduct, loading: isDataLoading } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const isEditMode = !!editingProduct;
    const [imageFile, setImageFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const [productCategories, setProductCategories] = useState([]); // New state for categories of the product being edited

    const getInitialFormData = useCallback((product) => {
        return {
            name: product?.name || '',
            description: product?.description || '',
            price: product?.price || 0,
            stock_quantity: product?.stock_quantity || 0,
            categoryIds: product?.category_ids || product?.categories?.map(cat => cat.id) || [],
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
    
    const [formData, setFormData] = useState(() => getInitialFormData(null));

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
    
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                        placeholder="Search by product name..."
                        className="pl-10 pr-4 py-2 border rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setViewMode('grid')} variant={viewMode === 'grid' ? 'solid' : 'outline'} className={viewMode === 'grid' ? 'bg-indigo-600 text-white' : ''}>Grid</Button>
                    <Button onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'solid' : 'outline'} className={viewMode === 'list' ? 'bg-indigo-600 text-white' : ''}>List</Button>
                </div>
                <Button onClick={handleOpenAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add New Product
                </Button>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> {/* Changed gap-8 to gap-4 */}
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                            <div className="relative h-48 w-full p-1 bg-white border border-gray-200" onClick={() => handleOpenEditModal(product)}>
                                <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="contain" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-800">{truncateText(product.name, 40)}</h3>
                                <p className="text-sm text-gray-500">{product.brandName}</p>
                                <p className="text-sm text-gray-500">{truncateText(product.description)}</p>
                                <p className="text-lg font-semibold text-indigo-600 mt-2">AED {product.price.toFixed(2)}</p>
                                <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <Package className="h-4 w-4 mr-1" />
                                    <span>
                                        {product.stock_quantity > 0 ? `Stock: ${product.stock_quantity}` : 'Out of Stock'}
                                    </span>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditModal(product); }}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredProducts.map(product => (
                        <ProductListItem
                            key={product.id}
                            product={product}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
            
            {filteredProducts.length === 0 && (
                <div className="text-center mt-10">
                    <p className="text-xl text-gray-500">No products found.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Edit Product' : 'Add Product'} size="max-w-lg md:max-w-2xl lg:max-w-6xl">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Left Column */}
                                        <div className="md:col-span-2 space-y-6">
                                            {/* General Information */}
                                            <h3 className="text-2xl font-bold text-gray-800 mb-6">General Information</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
                                                </div>
                                                <div>
                                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                                    <AutoResizeTextarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
                                                </div>
                                                <div>
                                                    <label htmlFor="long_description" className="block text-sm font-medium text-gray-700">Long Description</label>
                                                    <AutoResizeTextarea name="long_description" id="long_description" value={formData.long_description} onChange={handleChange} rows={6} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
                                                </div>
                                            </div>
                                            <hr className="my-6 border-gray-200" />
                    
                                            {/* Product Details */}
                                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Product Details</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">Benefits</label>
                                                    <AutoResizeTextarea name="benefits" id="benefits" value={formData.benefits} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
                                                </div>
                                                <div>
                                                    <label htmlFor="how_to_use" className="block text-sm font-medium text-gray-700">How to Use</label>
                                                    <AutoResizeTextarea name="how_to_use" id="how_to_use" value={formData.how_to_use} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
                                                </div>
                                                <div>
                                                    <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
                                                    <AutoResizeTextarea name="ingredients" id="ingredients" value={formData.ingredients} onChange={handleChange} rows={5} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
                                                </div>
                                            </div>
                                            <hr className="my-6 border-gray-200" />

                        {/* Media */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Image</label>
                                <div className="mt-1 w-full h-48 relative rounded-lg overflow-hidden border border-gray-300">
                                    {editingProduct?.imageUrl ? (
                                        <Image src={editingProduct.imageUrl} alt="Current product image" layout="fill" objectFit="contain" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-gray-100">
                                            <p className="text-gray-500">No Image</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="image" className="block text-sm font-medium text-gray-700">New Image</label>
                                <input type="file" name="image" id="image" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" disabled={isSubmitting} />
                                {imageFile && (
                                    <div className="mt-4 w-full h-48 relative rounded-lg overflow-hidden border border-gray-300">
                                        <Image src={URL.createObjectURL(imageFile)} alt="New image preview" layout="fill" objectFit="contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <hr className="my-6 border-gray-200" />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Pricing */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Pricing</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
                            </div>
                            <div>
                                <label htmlFor="comparedprice" className="block text-sm font-medium text-gray-700">Compared at Price</label>
                                <input type="number" name="comparedprice" id="comparedprice" value={formData.comparedprice} onChange={handleChange} step="0.01" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isSubmitting} />
                                <hr className="my-6 border-gray-200" />
                            </div>
                        </div>

                        {/* Inventory */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Inventory</h3>
                        <div>
                            <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                            <input type="number" name="stock_quantity" id="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
                        </div>
                        <hr className="my-6 border-gray-200" />

                        {/* Organization */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Organization</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
                                <select name="brand" id="brand" value={formData.brand} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting}>
                                    <option value="">Select a brand</option>
                                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting}>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>
                        <hr className="my-6 border-gray-200" />

                        {/* Categories */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Categories</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {categories.map(c => (
                                <label key={c.id} htmlFor={`category-${c.id}`} className="flex items-center p-3 border rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        id={`category-${c.id}`}
                                        name="categoryIds"
                                        value={c.id}
                                        checked={formData.categoryIds.includes(c.id)}
                                        onChange={(e) => handleCategoryChange(c.id, e.target.checked)}
                                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        disabled={isSubmitting}
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">{c.name}</span>
                                </label>
                            ))}
                        </div>
                        <hr className="my-6 border-gray-200" />
                    </div>

                    {/* Form Actions */}
                    <div className="md:col-span-3 pt-6 flex justify-end space-x-4">
                        <Button type="button" onClick={handleCloseModal} variant="outline" className="px-6 py-3" disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : 'Save Product'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ManageProducts;