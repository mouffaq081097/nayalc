'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link'; // Import Link
import { useAppContext } from './context/AppContext';
import ProductCard from './components/ProductCard';
import Hero from './components/Hero';
import CategoryCard from './components/CategoryCard';
import FeaturedBrandCard from './components/FeaturedBrandCard';
// import { FEATURED_BRANDS } from './constants'; // Removed
import Slider from 'react-slick';

const HomePage = () => {
    const { products, categories, brands } = useAppContext(); // Added brands
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const categorySliderSettings = {
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: isMobile ? 2 : 4, // Dynamically set based on isMobile
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        lazyLoad: 'ondemand',
        responsive: [
            {
                breakpoint: 768, // For screens <= 768px (mobile and tablets)
                settings: {
                    slidesToShow: 2, // 2 columns for mobile/tablets
                    slidesToScroll: 1,
                    infinite: true,
                    dots: true
                }
            }
        ]
    };

    const productSliderSettings = {
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 4, // Default for desktop (screens >= 768px)
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        lazyLoad: 'ondemand',
        responsive: [
            {
                breakpoint: 768, // For screens <= 768px (mobile and tablets)
                settings: {
                    slidesToShow: 2, // 2 columns for mobile/tablets
                    slidesToScroll: 1,
                    infinite: true,
                    dots: true
                }
            }
        ]
    };

    const featuredProducts = products.slice(0, 4);

    const editorsChoiceIndex = useMemo(() => {
        if (featuredProducts.length === 0) return -1;
        return Math.floor(Math.random() * featuredProducts.length);
    }, [featuredProducts]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Hero />

            <section className="mt-16">
                <p style={{textAlign: 'left', color: 'var(--brand-muted)', marginBottom: '1.5rem'}}>Explore our curated collections, from essential daily care to targeted treatments for your specific needs.</p>
                <Slider {...categorySliderSettings}>
                    {categories && categories.map(category => <CategoryCard key={category.id} category={category} />)}
                </Slider>
            </section>
            
            <section className="mt-16">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <div>
                        <h2 style={{fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-text)', marginBottom: '0.5rem', fontFamily: 'serif', textAlign: 'left'}}>Featured Products</h2>
                        <p style={{textAlign: 'left', color: 'var(--brand-muted)'}}>Discover our top-rated and most popular products, handpicked for their exceptional quality and effectiveness.</p>
                    </div>
                    <Link href="/products" style={{color: 'var(--brand-blue)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                        View All
                        <span style={{fontSize: '1.25rem', lineHeight: '1', transform: 'translateY(1px)'}}>&rarr;</span> {/* Right arrow */}
                    </Link>
                </div>
                <Slider {...productSliderSettings}>
                    {featuredProducts.map((product, index) => <ProductCard key={product.id} product={product} isEditorsChoice={index === editorsChoiceIndex} />)}
                </Slider>
            </section>

            <section className="mt-16">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <div>
                        <h2 style={{fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-text)', marginBottom: '0.5rem', fontFamily: 'serif', textAlign: 'left'}}>New Arrivals</h2>
                        <p style={{textAlign: 'left', color: 'var(--brand-muted)'}}>Check out the latest additions to our collection.</p>
                    </div>
                    <Link href="/new-arrivals" style={{color: 'var(--brand-blue)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                        View All
                        <span style={{fontSize: '1.25rem', lineHeight: '1', transform: 'translateY(1px)'}}>&rarr;</span>
                    </Link>
                </div>
                <Slider {...productSliderSettings}>
                    {/* Assuming newArrivals is available in the context */}
                    {products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}
                </Slider>
            </section>

            <section className="mt-16">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <div>
                        <h2 style={{fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-text)', marginBottom: '0.5rem', fontFamily: 'serif', textAlign: 'left'}}>Best Sellers</h2>
                        <p style={{textAlign: 'left', color: 'var(--brand-muted)'}}>Discover our most loved and top-selling products.</p>
                    </div>
                    <Link href="/BestSellers" style={{color: 'var(--brand-blue)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                        View All
                        <span style={{fontSize: '1.25rem', lineHeight: '1', transform: 'translateY(1px)'}}>&rarr;</span>
                    </Link>
                </div>
                <Slider {...productSliderSettings}>
                    {/* Assuming bestSellers is available in the context */}
                    {products.slice(4, 8).map(product => <ProductCard key={product.id} product={product} />)}
                </Slider>
            </section>
            
             <section className="mt-16">
                                <h2 style={{fontSize: '1.875rem', fontWeight: '700', color: 'var(--brand-text)', marginBottom: '1.5rem', fontFamily: 'serif', textAlign: 'center'}}>Our Partner Brands</h2>
                <p style={{textAlign: 'center', color: 'var(--brand-muted)', marginBottom: '2rem', maxWidth: '42rem', margin: 'auto'}}>We are proud to partner with industry leaders in skincare innovation, bringing you the best in beauty science and nature.</p>
                <br />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {brands.map(brand => <FeaturedBrandCard key={brand.id} brand={brand} />)}
                </div>
            </section>

        </div>
    );
};

export default HomePage;