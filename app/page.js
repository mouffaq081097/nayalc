import React from 'react';
import { HeroSection } from './components/HeroSection';
import { FreeShippingNote } from './components/home/FreeShippingNote';
import { CampaignBanner } from './components/home/CampaignBanner';
import { BestSellers, BrandProducts, BuyAgainShelf, RecentlyViewedShelf } from './components/home/HomeShelves';
import { FeatureBanner, BrandPhotoBanner } from './components/home/FeatureBanner';
import { ShopByConcern } from './components/home/ShopByConcern';
import { BuildYourRoutine } from './components/BuildYourRoutine';
import { RewardsSection } from './components/RewardsSection';
import { JournalSection } from './components/JournalSection';
import { SocialFeed } from './components/SocialFeed';
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
        // After Pitaka. One rule for the order: each brand photo is followed by
        // that brand's products, and the shopping help (concerns, routine) sits
        // with the skincare. The footer (Footer.js) closes with "Glow with Naya Lumière".
        <div className="flex flex-col bg-white min-h-screen">
            <HeroSection dbSlides={dbSlides} />

            {/* Only when they apply: bag in progress, a live campaign, a returning customer */}
            <FreeShippingNote />
            <CampaignBanner campaign={campaign} />
            <BuyAgainShelf />
            <RecentlyViewedShelf />

            <BestSellers />

            {/* GERnétic */}
            <FeatureBanner
                desktopSlot="gernetic_range_desktop"
                mobileSlot="gernetic_range_mobile"
                bg="#f5f1e8"
                mobileBg="#ececec"
                eyebrow="GERnétic · Made in France"
                title="Care for every step of your ritual"
                text="Cleanse, treat, protect: the full GERnétic range, from the cleansing milk to the night cream."
                cta={{ label: 'Shop the range', href: '/brand/gernetic-international' }}
            />
            <BrandProducts brand="gernetic" title="Explore GERnétic skincare" />

            {/* Help choosing */}
            <ShopByConcern />
            <BuildYourRoutine />

            {/* Naya Lumière Perfumes: the dark banner flows into the black product band */}
            <FeatureBanner
                desktopSlot="perfumes_banner_desktop"
                mobileSlot="perfumes_banner_mobile"
                tone="dark"
                bg="#0d0502"
                mobileBg="#201610"
                eyebrow="Made in the UAE"
                title="Naya Lumière Perfumes"
                text="Our own eaux de parfum, created in the Emirates."
                cta={{ label: 'Discover the perfumes', href: '/brand/naya-lumiere-perfumes' }}
            />
            <BrandProducts brand="naya-lumiere-perfumes" tone="dark" />

            {/* Zorah */}
            <BrandPhotoBanner
                brand="zorah"
                eyebrow="Plant-based skincare"
                title="Zorah Biocosmétiques"
                text="Argan-rich formulas for skin that wants gentle, natural care."
                ctaLabel="Shop Zorah"
            />
            <BrandProducts brand="zorah" />

            <RewardsSection />
            <JournalSection />
            <SocialFeed />
        </div>
    );
}
