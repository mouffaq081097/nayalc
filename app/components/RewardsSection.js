'use client';

import Image from 'next/image';
import Link from 'next/link';

export function RewardsSection() {
  return (
    <section className="py-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/account/loyalty" className="block rounded-2xl overflow-hidden">
          <Image
            src="/Gemini_Generated_Image_gfhr8bgfhr8bgfhr.png"
            alt="Naya Rewards — Shop, earn points, and glow for less"
            width={1400}
            height={500}
            className="w-full h-auto object-cover hidden md:block"
            priority
          />
        </Link>
      </div>
    </section>
  );
}
