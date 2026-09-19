import React from 'react';
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';
import { BestSellers } from './components/BestSellers';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ForYouSection } from './components/ForYouSection';
import { SocialFeed } from './components/SocialFeed';
import { BuildYourRoutine } from './components/BuildYourRoutine';
import { JournalSection } from './components/JournalSection';
import { RewardsSection } from './components/RewardsSection';
import { SignatureBanner } from './components/SignatureBanner';
import db from '@/lib/db';

async function getHeroSlides() {
    try {
        const { rows } = await db.query('SELECT * FROM hero_slides WHERE is_active = true ORDER BY sort_order ASC, created_at DESC');
        return rows;
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }
}

export default async function HomePage() {
    const dbSlides = await getHeroSlides();

    return (
        <div className="flex flex-col bg-transparent min-h-screen">
            <HeroSection dbSlides={dbSlides} />
            <Categories />
            <BestSellers />
            {/* <PhilosophySection /> */}
            <BuildYourRoutine />
            <FeaturedProducts />
            <SignatureBanner />
            <ForYouSection />
            {/* <ReviewsSection /> */}
            {/* <OurStorySection /> */}
            <SocialFeed />
            <RewardsSection />
            <JournalSection />
        </div>
    );
}
