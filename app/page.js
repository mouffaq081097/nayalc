import React from 'react';
import Image from 'next/image';
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ForYouSection } from './components/ForYouSection';
import { SocialFeed } from './components/SocialFeed';
import TabbyHeroBanner from './components/TabbyHeroBanner';
import { BuildYourRoutine } from './components/BuildYourRoutine';
import { RewardsSection } from './components/RewardsSection';
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
            {/* <PhilosophySection /> */}
            <BuildYourRoutine />
            <FeaturedProducts />
            <TabbyHeroBanner />
            <div className="md:hidden">
                <Image
                    src="/ChatGPT Image Jun 2, 2026, 03_20_23 PM.png"
                    alt="Naya Lumière featured collection"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority={false}
                />
            </div>
            <ForYouSection />
            {/* <ReviewsSection /> */}
            {/* <OurStorySection /> */}
            <SocialFeed />
            <div className="md:hidden">
                <Image
                    src="/ChatGPT Image Jun 3, 2026, 03_23_31 PM1.png"
                    alt="Naya Lumière handmade collection"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority={false}
                />
            </div>
            <RewardsSection />
        </div>
    );
}
