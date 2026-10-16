'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AiConsultant from './AiConsultant';
import { ListingHeader } from './ListingHeader';

const LAVENDER = 'rgb(147,104,236)';

/**
 * Header for the store pages (Skincare, Fragrance, New arrivals, Sales): the
 * shared ListingHeader, plus the AI specialist link. A trailing "." in the old
 * titles ("Skincare.") is dropped.
 */
export default function StoreHeader({ title = 'Store', subtitle }) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const name = title.replace(/\.$/, '');

  return (
    <>
      <ListingHeader crumbs={[{ label: 'Home', href: '/' }, { label: name }]} title={name} subtitle={subtitle}>
        <button
          type="button"
          onClick={() => setIsAiOpen(true)}
          className="mt-1 inline-flex items-center gap-2 text-[13px] font-medium text-[#111114] underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900"
        >
          <Sparkles size={15} style={{ color: LAVENDER }} />
          Ask our AI skincare specialist
        </button>
      </ListingHeader>
      <AiConsultant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}
