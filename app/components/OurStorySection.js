'use client';

import Image from 'next/image';
import Link from 'next/link';

const LAVENDER = 'rgb(147,104,236)';

const stats = [
  { value: '12K+', label: 'Happy customers' },
  { value: '100%', label: 'Clean formulas' },
  { value: '24', label: 'Products' },
];

export function OurStorySection() {
  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          {/* Left — image */}
          <div className="relative w-full md:w-[48%] aspect-[4/3] md:aspect-auto md:min-h-[340px] flex-shrink-0">
            <Image
              src="/ChatGPT Image May 7, 2026, 04_20_15 PM.png"
              alt="Naya Lumière — born in the Gulf"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48vw"
            />
          </div>

          {/* Right — content */}
          <div className="flex-1 p-8 md:p-10 flex flex-col justify-center gap-5">
            <div>
              <p
                className="text-[11px] font-medium tracking-[0.18em] uppercase mb-2"
                style={{ color: LAVENDER }}
              >
                Our Story
              </p>
              <h2 className="text-[24px] md:text-[28px] font-bold text-gray-900 leading-snug mb-3">
                Born in the Gulf,<br />made for the world.
              </h2>
              <p className="text-[14px] text-gray-500 leading-relaxed max-w-md">
                Naya Lumière was founded in Dubai in 2023 with a simple belief: everyone deserves
                access to clinically effective skincare that respects their skin and the planet.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[22px] font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="text-sm font-medium self-start transition-colors"
              style={{ color: LAVENDER }}
            >
              Read our full story →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
