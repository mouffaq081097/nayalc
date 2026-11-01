'use client';

import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { ListingHeader } from './ListingHeader';
import { useT } from '../context/LocaleContext';

const LAVENDER = 'rgb(147,104,236)';

/**
 * Header for the store pages (Skincare, Fragrance, New arrivals, Sales): the
 * shared ListingHeader, plus a link to the skin quiz for anyone unsure what to
 * choose. A trailing "." in the old titles ("Skincare.") is dropped.
 */
export default function StoreHeader({ title = 'Store', subtitle }) {
  const t = useT();
  const name = title.replace(/\.$/, '');

  return (
    <ListingHeader crumbs={[{ label: 'Home', href: '/' }, { label: name }]} title={name} subtitle={subtitle}>
      <Link
        href="/skin-quiz"
        className="mt-1 inline-flex items-center gap-2 text-[13px] font-medium text-[#111114] underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900"
      >
        <ListChecks size={15} style={{ color: LAVENDER }} />
        {t('Not sure what suits your skin? Take the skin quiz')}
      </Link>
    </ListingHeader>
  );
}
