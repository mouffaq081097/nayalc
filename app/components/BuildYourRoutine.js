'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAppContext } from '../context/AppContext';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel.tsx';
import { Container } from './ui/Container';

const STEPS = [
  { step: 1, label: 'Cleanse', timing: 'AM & PM' },
  { step: 2, label: 'Tone', timing: 'AM & PM' },
  { step: 3, label: 'Treat', timing: 'AM' },
  { step: 4, label: 'Moisturise', timing: 'PM' },
];

const LAVENDER = 'rgb(147,104,236)';

export function BuildYourRoutine() {
  const { products } = useAppContext();
  const routineProducts = products.slice(0, 4);

  if (routineProducts.length < 4) return null;

  const totalPrice = routineProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);

  const Card = ({ product, i }) => {
    const { step, label, timing } = STEPS[i];
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
            <CarouselContent className="-ml-3">
              {routineProducts.map((product, i) => (
                <CarouselItem key={product.id} className="pl-3 basis-1/2">
                  <Card product={product} i={i} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop: 4-col grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {routineProducts.map((product, i) => (
            <Card key={product.id} product={product} i={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
