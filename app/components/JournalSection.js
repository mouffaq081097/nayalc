'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './ui/carousel.tsx';
import { Container } from './ui/Container';
import { BookOpen } from 'lucide-react';
import { useJournalArticles } from '../hooks/useJournalArticles';

const LAVENDER = 'rgb(147,104,236)';

function TeaserCard({ article }) {
  const cover = article.coverImageUrl;
  return (
    <Link href={`/journal/${article.slug}`} className="group block">
      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 45vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(147,104,236,0.06)' }}>
            <BookOpen size={26} style={{ color: LAVENDER }} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <p className="mt-2.5 text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:opacity-70 transition-opacity">
        {article.title}
      </p>
    </Link>
  );
}

function HubTile() {
  return (
    <Link href="/journal" className="group block">
      <div
        className="aspect-square rounded-lg flex flex-col items-center justify-center text-center px-3 transition-opacity group-hover:opacity-90"
        style={{ background: LAVENDER }}
      >
        <span className="text-[11px] font-semibold text-white uppercase tracking-[0.1em]">Our</span>
        <span className="text-[22px] font-extrabold text-white uppercase tracking-[0.02em] leading-none mt-1">Journal</span>
      </div>
    </Link>
  );
}

export function JournalSection() {
  const { articles, loading } = useJournalArticles();
  if (!loading && articles.length === 0) return null;

  const firstHalf = articles.slice(0, Math.ceil(articles.length / 2));
  const secondHalf = articles.slice(Math.ceil(articles.length / 2));

  return (
    <section className="py-4 relative overflow-hidden bg-white">
      <Container className="relative z-10">
        <div className="mb-4 flex flex-row justify-between items-end gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400">The Journal</p>
            <h2 className="text-[28px] md:text-[32px] font-bold text-gray-900 leading-tight">Stories from the house</h2>
          </div>
          <Link
            href="/journal"
            className="shrink-0 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: LAVENDER }}
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: 'start', loop: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {firstHalf.map((article) => (
                <CarouselItem key={article.slug} className="pl-3 basis-[42%] sm:basis-[26%] lg:basis-[16%]">
                  <TeaserCard article={article} />
                </CarouselItem>
              ))}
              <CarouselItem className="pl-3 basis-[42%] sm:basis-[26%] lg:basis-[16%]">
                <HubTile />
              </CarouselItem>
              {secondHalf.map((article) => (
                <CarouselItem key={article.slug} className="pl-3 basis-[42%] sm:basis-[26%] lg:basis-[16%]">
                  <TeaserCard article={article} />
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="hidden md:block">
              <CarouselPrevious
                className="left-[-18px] h-10 w-10 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(196,167,254,0.45)',
                  boxShadow: '0 2px 12px rgba(147,104,236,0.12)',
                }}
              />
              <CarouselNext
                className="right-[-18px] h-10 w-10 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(196,167,254,0.45)',
                  boxShadow: '0 2px 12px rgba(147,104,236,0.12)',
                }}
              />
            </div>
          </Carousel>
        )}
      </Container>
    </section>
  );
}
