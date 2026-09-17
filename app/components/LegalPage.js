import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from './ui/Container';

const LAVENDER = 'rgb(147,104,236)';

/**
 * Shared chrome for the policy pages (/privacy, /terms). Server components —
 * these are static documents, so there is nothing to hydrate.
 *
 * Follows the long-form treatment already used by the journal article page:
 * white ground, a constrained measure, sans-serif throughout, and lavender as
 * the single accent.
 */
export function LegalPage({ eyebrow, title, intro, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-white py-10">
      <Container>
        {/* Container is max-w-7xl; the inner measure keeps legal prose readable. */}
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={13} />
            Back to store
          </Link>

          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full mb-4"
            style={{ background: 'rgba(147,104,236,0.08)', color: LAVENDER }}
          >
            {eyebrow}
          </span>

          <h1 className="text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight mb-3">
            {title}
          </h1>

          {intro && <p className="text-[15px] leading-[1.8] text-gray-700 mb-3">{intro}</p>}

          <p className="text-[12px] text-gray-400">Last updated {lastUpdated}</p>

          <div className="mt-10">{children}</div>

          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-3">
              Questions
            </p>
            <p className="text-[14px] leading-[1.8] text-gray-700">
              Email{' '}
              <a
                href="mailto:info@nayalc.com"
                className="font-semibold hover:opacity-70 transition-opacity"
                style={{ color: LAVENDER }}
              >
                info@nayalc.com
              </a>
              , or read our{' '}
              <Link href="/terms" className="font-semibold hover:opacity-70 transition-opacity" style={{ color: LAVENDER }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold hover:opacity-70 transition-opacity" style={{ color: LAVENDER }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function Section({ n, title, children }) {
  return (
    <section className="border-t border-gray-100 pt-10 mt-10 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="text-[19px] md:text-[20px] font-bold text-gray-900 leading-snug mb-3">
        <span className="text-[12px] font-semibold mr-2 align-middle" style={{ color: LAVENDER }}>
          {String(n).padStart(2, '0')}
        </span>
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-[1.8] text-gray-700">{children}</div>
    </section>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="mt-[11px] h-1 w-1 rounded-full shrink-0"
            style={{ background: LAVENDER }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Deliberately loud. These are the details only the business can supply, and
 * they must not reach production unnoticed.
 */
export function Fill({ children }) {
  return (
    <mark className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold text-[13.5px]">
      {children}
    </mark>
  );
}
