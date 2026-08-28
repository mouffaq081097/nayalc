import React from 'react';
import { HeroSection } from './components/HeroSection';
import NayaLumiereHome from './components/home/NayaLumiereHome';
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
            <NayaLumiereHome />
        </div>
    );
}
