'use client';

import { Container } from '../components/ui/Container';
import { JournalCard } from '../components/JournalCard';
import { useJournalArticles } from '../hooks/useJournalArticles';

export default function JournalPage() {
  const { articles, loading } = useJournalArticles();

  return (
    <div className="min-h-screen bg-white py-10">
      <Container>
        <div className="text-center mb-10">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-2">The Journal</p>
          <h1 className="text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight">Stories from the house</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-lg mx-auto">
            Skincare science, routines, and the story behind the brands we carry.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 aspect-[4/3.6] bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <JournalCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[13.5px] text-gray-500">No stories published yet — check back soon.</p>
        )}
      </Container>
    </div>
  );
}
