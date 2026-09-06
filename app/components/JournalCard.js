'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';

const LAVENDER = 'rgb(147,104,236)';

export function JournalCard({ article }) {
  const cover = article.coverImageUrl;
  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(147,104,236,0.06)' }}>
            <BookOpen size={30} style={{ color: LAVENDER }} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <span
          className="self-start text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full mb-3"
          style={{ background: 'rgba(147,104,236,0.08)', color: LAVENDER }}
        >
          {article.tag}
        </span>
        <h2 className="text-[16px] font-bold text-gray-900 leading-snug mb-2 group-hover:opacity-80 transition-opacity">
          {article.title}
        </h2>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-4 flex-1">{article.excerpt}</p>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-gray-400">
          <Clock size={12} />
          {article.readTime}
        </span>
      </div>
    </Link>
  );
}
