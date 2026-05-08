'use client';

const REVIEWS = [
  {
    initials: 'FA',
    name: 'Fatima A.',
    location: 'Dubai, UAE',
    stars: 5,
    quote: '"My skin has never looked this radiant. The Vitamin C serum is a game-changer — visible results in just two weeks."',
  },
  {
    initials: 'SK',
    name: 'Sara K.',
    location: 'Riyadh, KSA',
    stars: 5,
    quote: '"Finally a brand that delivers what it promises. The overnight cream is now a non-negotiable in my routine."',
  },
  {
    initials: 'LM',
    name: 'Layla M.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    quote: '"Clean ingredients, luxury feel, and the Tabby payment option made it so easy. Absolutely obsessed!"',
  },
];

const LAVENDER = 'rgb(147,104,236)';
const LAVENDER_BG = 'rgb(237,233,254)';

export function ReviewsSection() {
  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 space-y-1">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Reviews</p>
          <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">
            Loved by 12,000+ customers
          </h2>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-amber-400 text-base tracking-tight">★★★★★</span>
            <span className="text-[13px] text-gray-500">4.9 average · 2,841 reviews</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REVIEWS.map(({ initials, name, location, stars, quote }) => (
            <div
              key={name}
              className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-white"
                    style={{ background: LAVENDER }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{name}</p>
                    <p className="text-[11px] text-gray-400">{location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0 pt-0.5">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.03 3.17H10.2L7.59 6.12l.98 3.17L6 7.34l-2.57 1.95.98-3.17L1.8 4.17H4.97L6 1z" fill={LAVENDER}/></svg>
                  <span style={{ color: LAVENDER }}>Verified</span>
                </div>
              </div>

              {/* Stars */}
              <span className="text-amber-400 text-sm tracking-tight">{'★'.repeat(stars)}</span>

              {/* Quote */}
              <p className="text-[13px] text-gray-600 leading-relaxed">{quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
