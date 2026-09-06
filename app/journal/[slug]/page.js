'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../../components/ui/Container';
import { useJournalArticles } from '../../hooks/useJournalArticles';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';

const LAVENDER = 'rgb(147,104,236)';

export default function JournalArticlePage({ params }) {
  const { slug } = use(params);
  const { articles, loading } = useJournalArticles();
  const article = articles.find((a) => a.slug === slug) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(147,104,236,0.2)', borderTopColor: LAVENDER }} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">Story not found</h1>
          <p className="text-[13px] text-gray-500 mb-6">This journal entry may have moved or no longer exists.</p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: LAVENDER }}
          >
            <ArrowLeft size={14} />
            Back to the Journal
          </Link>
        </div>
      </div>
    );
  }

  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white py-10">
      <Container className="max-w-3xl">
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={13} />
          The Journal
        </Link>

        {article.tag && (
          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full mb-4"
            style={{ background: 'rgba(147,104,236,0.08)', color: LAVENDER }}
          >
            {article.tag}
          </span>
        )}

        <h1 className="text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight mb-3">{article.title}</h1>

        {article.readTime && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 mb-6">
            <Clock size={13} />
            {article.readTime}
          </span>
        )}

        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-50 mb-8">
          {article.coverImageUrl ? (
            <Image src={article.coverImageUrl} alt={article.title} fill sizes="768px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(147,104,236,0.06)' }}>
              <BookOpen size={40} style={{ color: LAVENDER }} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="space-y-5 mb-10">
          {(article.body || []).map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-[1.8] text-gray-700">
              {paragraph}
            </p>
          ))}
        </div>

        {article.ctaHref && (
          <Link
            href={article.ctaHref}
            className="inline-flex items-center gap-1.5 h-12 px-7 rounded-full text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: LAVENDER }}
          >
            {article.ctaLabel || 'Shop now'}
            <ArrowRight size={14} />
          </Link>
        )}

        {related.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">More from the Journal</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/journal/${r.slug}`}
                  className="block rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: LAVENDER }}>
                    {r.tag}
                  </span>
                  <p className="text-[13.5px] font-semibold text-gray-900 mt-1.5 leading-snug">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
