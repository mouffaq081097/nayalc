import React from 'react';
import { HeroSection } from './components/HeroSection';
import { FreeShippingNote } from './components/home/FreeShippingNote';
import { CampaignBanner } from './components/home/CampaignBanner';
import { BestSellers, BrandProducts, BuyAgainShelf, RecentlyViewedShelf } from './components/home/HomeShelves';
import { FeatureBanner, BrandPhotoBanner } from './components/home/FeatureBanner';
import { ShopByConcern } from './components/home/ShopByConcern';
import { CategoryStrip } from './components/home/CategoryStrip';
import { JournalSection } from './components/JournalSection';
import { StoryVideos } from './components/home/StoryVideos';
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
        // After Pitaka: the GERnétic range right after the hero; the perfume and
        // Zorah photos are each followed by that brand's products; the shopping
        // help (shop by concern) follows the GERnétic banner. The footer (Footer.js) closes with "Glow with Naya Lumière".
        <div className="flex flex-col bg-white min-h-screen">
            <HeroSection dbSlides={dbSlides} />

            {/* Collections at a glance, right under the hero */}
            <CategoryStrip />

            {/* Only with items in the bag */}
            <FreeShippingNote />

            {/* GERnétic first: the brand's range straight after the hero */}
            <BrandProducts brand="gernetic" title="Explore GERnétic skincare" cardVariant="gallery" />

            {/* Only when they apply: a live campaign, a returning customer */}
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
                mobileTrimTop={0.22}
                eyebrow="GERnétic · Made in France"
                title="Care for every step of your ritual"
                text="Cleanse, treat, protect: the full GERnétic range, from the cleansing milk to the night cream."
                cta={{ label: 'Shop the range', href: '/brand/gernetic-international' }}
            />

            {/* Help choosing */}
            <ShopByConcern />

            {/* Naya Lumière Perfumes: the dark banner flows into the black product band */}
            <FeatureBanner
                desktopSlot="perfumes_banner_desktop"
                mobileSlot="perfumes_banner_mobile"
                tone="dark"
                bg="#0d0502"
                mobileBg="linear-gradient(180deg,#1f150b 0%,#442f1e 100%)"
                mobileTrimTop={0.26}
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

            {/* Story band with two videos (Admin → Homepage images → Story videos); hidden until one is uploaded */}
            <StoryVideos
                title="The Naya ritual"
                text="Skincare from France and fragrance from the Emirates, chosen to become part of your every day."
                href="/journal"
            />

            <JournalSection />
            <SocialFeed />
        </div>
    );
}
