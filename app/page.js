import React from 'react';
import { HeroSection } from './components/HeroSection';
import { TrustStrip } from './components/home/TrustStrip';
import { CategoryTiles } from './components/home/CategoryTiles';
import { BestSellersShelf, OffersShelf, BuyAgainShelf, RecentlyViewedShelf } from './components/home/HomeShelves';
import { CampaignBanner } from './components/home/CampaignBanner';
import { FreeShippingNote } from './components/home/FreeShippingNote';
import { ShopByConcern } from './components/home/ShopByConcern';
import { BrandSpotlight } from './components/home/BrandSpotlight';
import { SocialFeed } from './components/SocialFeed';
import { BuildYourRoutine } from './components/BuildYourRoutine';
import { JournalSection } from './components/JournalSection';
import { RewardsSection } from './components/RewardsSection';
import db from '@/lib/db';
import { getActiveCampaign } from '@/lib/campaigns';

// Re-read hero slides and the campaign at most a minute late, so a scheduled
// campaign starts on time without a deploy (the banner hides itself when it ends).
export const revalidate = 60;

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
    const [dbSlides, campaign] = await Promise.all([getHeroSlides(), getActiveCampaign()]);

    return (
        // Shortcuts first, then shelves; each brand is a magazine spread on a
        // lavender band (photo side alternating) that leads into its products.
        <div className="flex flex-col bg-transparent min-h-screen">
            <HeroSection dbSlides={dbSlides} />
            <FreeShippingNote />
            <TrustStrip />
            <CategoryTiles />
            <CampaignBanner campaign={campaign} />
            <BuyAgainShelf />
            <RecentlyViewedShelf />
            <BestSellersShelf />
            <BrandSpotlight
                brand="gernetic"
                eyebrow="Made in France"
                title="GERnétic"
                text="Cellular skincare from France: the professional treatments therapists use, made simple enough for your everyday routine."
                cta="Shop GERnétic"
            />
            <ShopByConcern />
            <BuildYourRoutine />
            <BrandSpotlight
                brand="naya-lumiere-perfumes"
                eyebrow="Made in the UAE"
                title="Naya Lumière Perfumes"
                text="Our own eaux de parfum, created in the Emirates."
                cta="Discover the perfumes"
                align="right"
            />
            <OffersShelf />
            <BrandSpotlight
                brand="zorah"
                eyebrow="Plant-based skincare"
                title="Zorah Biocosmétiques"
                text="Argan-rich formulas for skin that wants gentle, natural care."
                cta="Shop Zorah"
            />
            <RewardsSection />
            <JournalSection />
            <SocialFeed />
        </div>
    );
}
