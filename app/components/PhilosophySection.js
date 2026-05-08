'use client';

import Link from 'next/link';
import Image from 'next/image';

const stats = [
  { value: '100%', label: 'Natural Origin Actives' },
  { value: '30+', label: 'Years of Research' },
  { value: '0', label: 'Harmful Fillers' },
];

export function PhilosophySection() {
  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          {/* Left — image */}
          <div className="relative w-full md:w-[44%] aspect-[4/3] md:aspect-auto md:min-h-[320px] flex-shrink-0">
            <Image
              src="/engin-akyurt-g-m8EDc4X6Q-unsplash.jpg"
              alt="Clean ingredients"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 44vw"
            />
          </div>

          {/* Right — content */}
          <div className="flex-1 p-8 md:p-10 flex flex-col justify-center gap-5">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] uppercase mb-2" style={{ color: 'rgb(147,104,236)' }}>Our Philosophy</p>
              <h2 className="text-[26px] md:text-[30px] font-bold text-gray-900 leading-tight mb-3">
                Science meets nature.
              </h2>
              <p className="text-[14px] text-gray-500 leading-relaxed max-w-md">
                Every formula is built on clinically validated actives and pure botanical extracts —
                no unnecessary fillers, no synthetic fragrance, no compromise. We source globally,
                formulate with care, and test rigorously.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 py-4 px-3 text-center"
                >
                  <p className="text-[22px] font-bold leading-none mb-1" style={{ color: 'rgb(147,104,236)' }}>{value}</p>
                  <p className="text-[11px] text-gray-400 leading-snug">{label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/all-products"
              className="text-sm font-medium transition-colors self-start"
              style={{ color: 'rgb(147,104,236)' }}
            >
              Explore our brands →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
