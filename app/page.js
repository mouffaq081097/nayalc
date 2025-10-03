'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link'; // Import Link
import { useAppContext } from './context/AppContext';
import ProductCard from './components/ProductCard';
import Hero from './components/Hero';
import { HeroSection } from './components/HeroSection'; // Add this import
import CategoryCard from './components/CategoryCard';
import FeaturedBrandCard from './components/FeaturedBrandCard';
import Carousel from './components/Carousel';
import { FeaturedProducts } from './components/FeaturedProducts';
import { Categories } from './components/Categories'; // Add this import
import Brands from './components/Brands';
import { SocialProof, SocialProofBadge } from './components/SocialProof.js';
import { Container } from './components/ui/Container';
// import { FEATURED_BRANDS } from './constants'; // Removed


const HomePage = () => {
    const { products, categories, brands, featuredProducts } = useAppContext(); // Added brands






    const editorsChoiceIndex = useMemo(() => {
        if (featuredProducts.length === 0) return -1;
        return Math.floor(Math.random() * featuredProducts.length);
    }, [featuredProducts]);

    return (
        <>
            <HeroSection />

            <Categories />

            <FeaturedProducts products={featuredProducts} />

            <Brands />


        </>
    );
};

export default HomePage;