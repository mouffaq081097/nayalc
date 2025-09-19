'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link'; // Import Link
import { useAppContext } from './context/AppContext';
import ProductCard from './components/ProductCard';
import Hero from './components/Hero';
import CategoryCard from './components/CategoryCard';
import FeaturedBrandCard from './components/FeaturedBrandCard';
import Carousel from './components/Carousel';
// import { FEATURED_BRANDS } from './constants'; // Removed


const HomePage = () => {
    const { products, categories, brands } = useAppContext(); // Added brands






    const featuredProducts = products.slice(0, 4);

    const editorsChoiceIndex = useMemo(() => {
        if (featuredProducts.length === 0) return -1;
        return Math.floor(Math.random() * featuredProducts.length);
    }, [featuredProducts]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Hero />

            <section className="mt-16">
                <p className="text-left text-[var(--brand-muted)] mb-6">Explore our curated collections, from essential daily care to targeted treatments for your specific needs.</p>
                <Carousel>
                    {categories && categories.map(category => <CategoryCard key={category.id} category={category} />)}
                </Carousel>
            </section>
            
            <section className="mt-16">
                <div className="flex justify-between items-center mb-6 flex-col sm:flex-row text-center sm:text-left">
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--brand-text)] mb-2 font-serif">Featured Products</h2>
                        <p className="text-[var(--brand-muted)]">Discover our top-rated and most popular products, handpicked for their exceptional quality and effectiveness.</p>
                    </div>
                    <Link href="/products" className="text-[var(--brand-blue)] font-semibold flex items-center gap-1 mt-4 sm:mt-0">
                        View All
                        <span className="text-xl leading-none translate-y-px">&rarr;</span> {/* Right arrow */}
                    </Link>
                </div>
                <Carousel>
                    {featuredProducts.map((product, index) => <ProductCard key={product.id} product={product} isEditorsChoice={index === editorsChoiceIndex} />)}
                </Carousel>
            </section>

            <section className="mt-16">
                <div className="flex justify-between items-center mb-6 flex-col sm:flex-row text-center sm:text-left">
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--brand-text)] mb-2 font-serif">New Arrivals</h2>
                        <p className="text-[var(--brand-muted)]">Check out the latest additions to our collection.</p>
                    </div>
                    <Link href="/new-arrivals" className="text-[var(--brand-blue)] font-semibold flex items-center gap-1 mt-4 sm:mt-0">
                        View All
                        <span className="text-xl leading-none translate-y-px">&rarr;</span>
                    </Link>
                </div>
                <Carousel>
                    {/* Assuming newArrivals is available in the context */}
                    {products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}
                </Carousel>
            </section>

            <section className="mt-16">
                <div className="flex justify-between items-center mb-6 flex-col sm:flex-row text-center sm:text-left">
                    <div>
                        <h2 className="text-3xl font-bold text-[var(--brand-text)] mb-2 font-serif">Best Sellers</h2>
                        <p className="text-[var(--brand-muted)]">Discover our most loved and top-selling products.</p>
                    </div>
                    <Link href="/BestSellers" className="text-[var(--brand-blue)] font-semibold flex items-center gap-1 mt-4 sm:mt-0">
                        View All
                        <span className="text-xl leading-none translate-y-px">&rarr;</span>
                    </Link>
                </div>
                <Carousel>
                    {/* Assuming bestSellers is available in the context */}
                    {products.slice(4, 8).map(product => <ProductCard key={product.id} product={product} />)}
                </Carousel>
            </section>
            
             <section className="mt-16">
                                <h2 className="text-3xl font-bold text-[var(--brand-text)] mb-6 font-serif text-center">Our Partner Brands</h2>
                <p className="text-center text-[var(--brand-muted)] mb-8 max-w-xl mx-auto">We are proud to partner with industry leaders in skincare innovation, bringing you the best in beauty science and nature.</p>
                <br />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {brands.map(brand => <FeaturedBrandCard key={brand.id} brand={brand} />)}
                </div>
            </section>

        </div>
    );
};

export default HomePage;