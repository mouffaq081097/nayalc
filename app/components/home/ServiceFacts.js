'use client';

import Link from 'next/link';
import { Truck, Clock3, RotateCcw, CreditCard } from 'lucide-react';
import { Container } from '../ui/Container';
import { FREE_SHIPPING_FROM, TRANSIT_LABEL } from '@/lib/shipping';
import { RETURN_WINDOW_DAYS } from '@/lib/policies';
import { useT } from '../../context/LocaleContext';

/**
 * Four plain facts under the collection strip, for visitors who haven't
 * opened a product yet: free delivery, delivery time, returns and Tabby. The
 * same numbers as the product page and the policies (lib/shipping.js,
 * lib/policies.js), each linking to the details. Two by two on phones.
 */
export function ServiceFacts() {
  const t = useT();
  const facts = [
    { Icon: Truck, title: t('Free delivery'), sub: t('On {n}+ items', { n: FREE_SHIPPING_FROM }), href: '/shipping-returns#delivery' },
    { Icon: Clock3, title: t(TRANSIT_LABEL), sub: t('Across the UAE'), href: '/shipping-returns#delivery' },
    { Icon: RotateCcw, title: t('{n}-day returns', { n: RETURN_WINDOW_DAYS }), sub: t('Unopened items'), href: '/shipping-returns#returns' },
    { Icon: CreditCard, title: t('Split your payment'), sub: t('With Tabby'), href: '/faq' },
  ];

  return (
    <section aria-label={t('Why shop with us')} className="bg-white border-b border-[#ececec]">
      <Container wide>
        <ul className="grid grid-cols-2 lg:grid-cols-4">
          {facts.map(({ Icon, title, sub, href }, i) => (
            <li key={href + i} className={`${i % 2 ? 'border-s border-[#ececec]' : ''} ${i > 1 ? 'border-t lg:border-t-0 border-[#ececec]' : ''} ${i === 2 ? 'lg:border-s' : ''}`}>
              <Link href={href} className="group flex h-full items-center gap-3 px-2 py-4 md:px-5 md:py-5 lg:justify-center">
                <Icon size={20} strokeWidth={1.5} className="shrink-0 text-[#111114]" aria-hidden="true" />
                <span className="min-w-0 leading-tight">
                  <span className="block text-[13px] md:text-[14px] font-semibold text-[#111114] group-hover:underline underline-offset-4">{title}</span>
                  <span className="block mt-0.5 text-[12px] md:text-[12.5px] text-[#6b6b73]">{sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
