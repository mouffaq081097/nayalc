'use client';
import React from 'react';
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ForYouSection } from './components/ForYouSection';
import { EditorialShowcase } from './components/EditorialShowcase';

const HomePage = () => {
    return (
        <div className="flex flex-col">
            <HeroSection />
            <Categories />
            <FeaturedProducts />
            <ForYouSection />
            <EditorialShowcase />
        </div>
    );
};

export default HomePage;
