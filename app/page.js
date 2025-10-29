'use client';
import React from 'react';
import { useAppContext } from './context/AppContext';
import { FeaturedProducts } from './components/FeaturedProducts';
import { Categories } from './components/Categories'; // Add this import
import { HeroSection } from './components/HeroSection';
import { ForYouSection } from './components/ForYouSection';
import { MobileWelcomeBar } from './components/MobileWelcomeBar';
// import { FEATURED_BRANDS } from './constants'; // Removed


const HomePage = () => {
    const { featuredProducts } = useAppContext();








    return (
        <>
            <HeroSection />
            <MobileWelcomeBar />
            <Categories />

            <FeaturedProducts products={featuredProducts} />

            <ForYouSection />
        </>
    );
};

export default HomePage;