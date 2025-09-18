'use client';
import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { useParams } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../../components/ProductCard';

const CategoryPage = () => {
    const { categoryName: encodedCategoryName } = useParams();
    const categoryName = decodeURIComponent(encodedCategoryName);
    const { categories, fetchProductsByCategory } = useAppContext(); // Get fetchProductsByCategory

    // Remove console.log statements after confirming fix
    // console.log('categoryName from URL:', categoryName);
    // console.log('All categories:', categories);
    // console.log('Result of find:', categories.find(c => c.name === categoryName));

    const [categoryProducts, setCategoryProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);

    // Fetch products specifically for this category
    useEffect(() => {
        const getCategoryProducts = async () => {
            setLoadingProducts(true);
            setErrorProducts(null);
            try {
                const products = await fetchProductsByCategory(categoryName);
                setCategoryProducts(products);
            } catch (err) {
                setErrorProducts('Failed to load products for this category.');
                console.error(err); // Keep console.error for debugging
            } finally {
                setLoadingProducts(false);
            }
        };

        if (categoryName) {
            getCategoryProducts();
        }
    }, [categoryName, fetchProductsByCategory]); // Re-run when categoryName or fetchProductsByCategory changes

    const currentCategory = categories.find(c => c.name === categoryName);

    if (loadingProducts) { // Use local loading state
        return <div className="text-center py-20">Loading products for {categoryName}...</div>;
    }

    if (errorProducts) { // Display error if fetching failed
        return <div className="text-center py-20 text-red-500">{errorProducts}</div>;
    }

    if (!currentCategory) {
        return <div className="text-center py-20">Category not found.</div>;
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-serif font-bold text-brand-text">{currentCategory.name}</h1>
                <p className="text-brand-muted mt-2 max-w-2xl mx-auto">{currentCategory.description}</p>
            </div>

            {categoryProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categoryProducts.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-md">
                    <p className="text-xl text-brand-muted">No products found in this category yet.</p>
                </div>
            )}
        </div>
    );
};

export default CategoryPage;