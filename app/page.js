import React from 'react';
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ForYouSection } from './components/ForYouSection';
import { EditorialShowcase } from './components/EditorialShowcase';
import { SocialFeed } from './components/SocialFeed';

export default function HomePage() {
    return (
        <div className="flex flex-col bg-transparent min-h-screen">
            <HeroSection />
            <Categories />
            <FeaturedProducts />
            <ForYouSection />
            <EditorialShowcase />
            <SocialFeed />
        </div>
    );
}
