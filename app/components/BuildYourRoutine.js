'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppContext } from '../context/AppContext';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';
import { Container } from './ui/Container';

// Real routine steps, matched against each product's actual category names
// (product.categoryNames, a real ", "-joined string from the live catalog) —
// never a positional guess. A step is only shown if a real, in-stock product
// in that category actually exists, so the label always matches the product.
const STEP_DEFS = [
  { key: 'cleanse', label: 'Cleanse', timing: 'AM & PM', match: /cleans|makeup\s*remov|micellar/i },
  { key: 'tone', label: 'Tone', timing: 'AM & PM', match: /toner|tonic|essence/i },
  { key: 'treat', label: 'Treat', timing: 'AM & PM', match: /serum|treatment|anti[-\s]?aging|concern/i },
  { key: 'moisturise', label: 'Moisturise', timing: 'PM', match: /moistur|cream|lotion|balm|lift|firm/i },
  { key: 'protect', label: 'Protect', timing: 'AM', match: /spf|sun|protect/i },
];

const GRID_COLS = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' };

const LAVENDER = 'rgb(147,104,236)';

function categoryList(product) {
  return (product.categoryNames || '').split(',').map((s) => s.trim()).filter(Boolean);
}

/** For each real step, the best real in-stock candidate in that category (by rating, then review volume) — skipping steps with no real match rather than mislabeling an unrelated product. Each product is used at most once. */
function pickRoutine(products) {
  const inStock = products.filter((p) => Number(p.stock_quantity) > 0);
  const used = new Set();
  const picked = [];
  for (const step of STEP_DEFS) {
    const candidate = inStock
      .filter((p) => !used.has(p.id) && categoryList(p).some((c) => step.match.test(c)))
      .sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0) || Number(b.reviewCount || 0) - Number(a.reviewCount || 0))[0];
    if (candidate) {
      used.add(candidate.id);
      picked.push({ ...step, product: candidate });
    }
  }
  return picked;
}

export function BuildYourRoutine() {
  const { products } = useAppContext();
  const routine = pickRoutine(products);

  if (routine.length < 2) return null;

  const totalPrice = routine.reduce((sum, r) => sum + Number(r.product.price || 0), 0);

  const Card = ({ product, i, label, timing }) => {
    const step = i + 1;
    return (
      <Link
        href={`/product/${product.id}`}
        className="group rounded-2xl border border-gray-100 overflow-hidden bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200 flex flex-col"
      >
        <div className="relative bg-gray-50 aspect-square">
          <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: LAVENDER }}>
            <span className="text-[11px] font-bold text-white">{step}</span>
          </div>
          <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-white/80 border border-gray-100">
            <span className="text-[10px] font-medium text-gray-500">{timing}</span>
          </div>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 80vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-200">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: LAVENDER }}>{label}</p>
          <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
          <p className="text-[13px] font-medium text-gray-500 mt-0.5">AED {Number(product.price).toFixed(0)}</p>
        </div>
      </Link>
    );
  };

  return (
    <section className="py-4 bg-white">
      <Container>
        {/* Header */}
        <div className="flex flex-row justify-between items-end mb-4 gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">Personalised</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Build Your Routine</h2>
          </div>
          <Link
            href="/all-products"
            className="shrink-0 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'rgb(147,104,236)' }}
          >
            Shop all → AED {totalPrice.toFixed(0)}
          </Link>
        </div>

        {/* Mobile: carousel */}
        <div className="md:hidden">
          <Carousel opts={{ align: 'start', loop: false }} className="w-full">
            <CarouselContent className="-ml-2">
              {routine.map((r, i) => (
                <CarouselItem key={r.product.id} className="pl-2 basis-1/2">
                  <Card product={r.product} i={i} label={r.label} timing={r.timing} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: grid, sized to however many real steps matched */}
        <div className={`hidden md:grid ${GRID_COLS[routine.length] || 'md:grid-cols-4'} gap-2`}>
          {routine.map((r, i) => (
            <Card key={r.product.id} product={r.product} i={i} label={r.label} timing={r.timing} />
          ))}
        </div>
      </Container>
    </section>
  );
}
