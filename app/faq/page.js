import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { InfoPage } from '../components/InfoPage';
import { SHIPPING_TIERS, formatShipping, TRANSIT_LABEL, FREE_SHIPPING_FROM } from '@/lib/shipping';
import { RETURN_WINDOW_DAYS } from '@/lib/policies';
import { AED_PER_POINT, POINTS_BLOCK, AED_PER_BLOCK, WELCOME_BONUS_POINTS } from '@/lib/loyalty';

export const metadata = {
  title: 'FAQ',
  description: 'Delivery, payment, returns, pre-orders, Naya Rewards points and discount codes at Naya Lumière Cosmetics.',
  alternates: { canonical: '/faq' },
};

const [one, two] = SHIPPING_TIERS;

// Every answer is plain text so the same words go into the FAQ structured data
const QUESTIONS = [
  {
    q: 'How long does delivery take?',
    a: `Orders placed by 2 PM UAE time on a working day leave our warehouse the same day, and delivery takes ${TRANSIT_LABEL}. Each product page shows the dates for an order placed now.`,
    more: { href: '/shipping-returns#delivery', label: 'Delivery details' },
  },
  {
    q: 'How much does delivery cost?',
    a: `${formatShipping(one.cost)} for one item, ${formatShipping(two.cost)} for two, and free from ${FREE_SHIPPING_FROM} items. Delivery prices include VAT.`,
  },
  {
    q: 'Do I need an account to order?',
    a: 'No. Check out with just your email and address, and we’ll save the order under that email so you can track it. To pay cash on delivery or spend your points, sign in with the 6-digit code we email you. There’s no password.',
  },
  {
    q: 'Can I pay cash on delivery?',
    a: 'Yes, when you’re signed in. Choose cash on delivery at checkout. It isn’t available for orders that include a pre-order item.',
  },
  {
    q: 'Can I pay in instalments?',
    a: 'Yes, with Tabby. Choose Tabby at checkout to see the plans available for your order.',
  },
  {
    q: 'Are your products authentic?',
    a: 'Yes. We’re an official retailer of GERnétic, Zorah and Naya Lumière Perfumes, and every product comes from the brand.',
  },
  {
    q: 'Can I return a product?',
    a: `Unopened products in their original sealed condition can be returned within ${RETURN_WINDOW_DAYS} days of delivery for a refund or exchange. For hygiene reasons, opened products can’t be returned unless they’re faulty.`,
    more: { href: '/shipping-returns#returns', label: 'How returns work' },
  },
  {
    q: 'How do I track my order?',
    a: 'When your order ships, we email you the courier and a tracking link. You can also follow it in My orders.',
    more: { href: '/account/orders', label: 'My orders' },
  },
  {
    q: 'What is a pre-order?',
    a: 'Some products can be ordered while they’re out of stock. The product page shows the date they’ll ship by, and the whole order ships in one parcel once everything is in. If the date moves, we email you, and you can cancel a waiting order from My orders.',
  },
  {
    q: 'Is there a discount on my first order?',
    a: 'Yes. Sign up with your email at the bottom of any page and use code WELCOME10 for 10% off your first order.',
  },
  {
    q: 'How do Naya Rewards points work?',
    a: `You earn 1 point for every AED ${AED_PER_POINT} you spend on products, and more as you move up the tiers. Every ${POINTS_BLOCK} points take AED ${AED_PER_BLOCK} off an order. Your first delivered order adds ${WELCOME_BONUS_POINTS} bonus points.`,
    more: { href: '/account/loyalty', label: 'Naya Rewards' },
  },
  {
    q: 'Which products are right for my skin?',
    a: 'Take our skin quiz for a routine matched to your skin type and concerns, or contact us and we’ll help you choose.',
    more: { href: '/skin-quiz', label: 'Take the skin quiz' },
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: QUESTIONS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function FaqPage() {
  return (
    <InfoPage title="FAQ" intro="Answers to the questions we hear most. Can't find yours? Get in touch below.">
      {/* Plain script tag so it's in the server HTML (next/script would add it after load) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="border-t border-[#111114]">
        {QUESTIONS.map(({ q, a, more }) => (
          <details key={q} className="group border-b border-[#e6e4df]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15.5px] font-medium text-[#111114] [&::-webkit-details-marker]:hidden">
              {q}
              <Plus size={18} strokeWidth={1.6} className="shrink-0 group-open:hidden" />
              <Minus size={18} strokeWidth={1.6} className="shrink-0 hidden group-open:block" />
            </summary>
            <div className="pb-5 pr-8 text-[15px] leading-relaxed text-[#4b4b53]">
              <p>{a}</p>
              {more && (
                <Link href={more.href} className="mt-2 inline-block text-[14px] underline underline-offset-4 text-[#111114]">{more.label}</Link>
              )}
            </div>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
