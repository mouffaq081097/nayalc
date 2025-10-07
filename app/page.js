'use client';
import React from 'react';
import { useAppContext } from './context/AppContext';
import { HeroSection } from './components/HeroSection'; // Add this import
import { FeaturedProducts } from './components/FeaturedProducts';
import { Categories } from './components/Categories'; // Add this import
import Brands from './components/Brands';
// import { FEATURED_BRANDS } from './constants'; // Removed


const HomePage = () => {
    const { featuredProducts } = useAppContext();








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