'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Container } from './ui/Container';
import { useJournalArticles } from '../hooks/useJournalArticles';
import { SectionHeading, Pill } from './home/SectionHeading';
import { headingFont } from './home/headingFont';
import { useT } from '../context/LocaleContext';

/**
 * The three latest journal articles: cover, title, a two-line summary and a
 * "Read the article" link, then a pill to the journal. Phones swipe the cards.
 */
export function JournalSection() {
  const { articles, loading } = useJournalArticles();
  const t = useT();
  if (!loading && articles.length === 0) return null;

  return (
    <section className="pt-8 md:pt-12 bg-white">
      <Container wide>
        <SectionHeading title="From the journal" />
        <div className="grid grid-flow-col auto-cols-[82%] md:grid-flow-row md:grid-cols-3 md:auto-cols-auto gap-3.5 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[4/3] bg-[#f6f5f2] animate-pulse" />)
            : articles.slice(0, 3).map((article) => (
                <Link key={article.slug} href={`/journal/${article.slug}`} className="group grid gap-3.5 content-start snap-start min-w-0">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f6f5f2]">
                    {article.coverImageUrl ? (
                      <Image src={article.coverImageUrl} alt="" fill sizes="(max-width: 768px) 82vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen size={28} strokeWidth={1.5} className="text-gray-400" /></div>
                    )}
                  </div>
                  <h3 className={`${headingFont} text-[18px] md:text-[19px] font-medium leading-[1.25] text-[#111114] text-balance`}><bdi>{article.title}</bdi></h3>
                  {article.excerpt && <p className="text-[14px] leading-relaxed text-[#6b6b73] line-clamp-2"><bdi>{article.excerpt}</bdi></p>}
                  <span className="text-[13px] font-semibold text-[#111114] underline underline-offset-4 decoration-gray-300 group-hover:decoration-gray-900">{t('Read the article')}</span>
                </Link>
              ))}
        </div>
        <div className="mt-6 md:mt-8 flex justify-center">
          <Pill href="/journal">Visit the journal</Pill>
        </div>
      </Container>
    </section>
  );
}
