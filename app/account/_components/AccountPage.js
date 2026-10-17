import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * The frame of the account pages redone after Pitaka (Addresses, Orders,
 * Wishlist, Naya Rewards…): no side panel, a "← Back to …" link, a big title
 * with an optional action on its right (e.g. "+ Add address"), then the page.
 */
export default function AccountPage({ title, subtitle, action, back = { href: '/account', label: 'Back to account' }, children }) {
  return (
    <div className="bg-white text-[#111114]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 pt-8 md:pt-14 pb-20">
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b72] hover:text-[#111114] transition-colors">
          <ArrowLeft size={14} strokeWidth={1.75} /> {back.label}
        </Link>
        <div className="mt-6 md:mt-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[28px] md:text-[36px] leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-[14px] md:text-[15px] text-[#6b6b72]">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Outlined ink pill, as "+ Add address" */
export const OUTLINE_PILL = 'inline-flex items-center justify-center gap-1 h-10 md:h-11 px-4 md:px-6 rounded-full border border-[#111114] text-[14px] md:text-[15px] hover:bg-[#111114] hover:text-white transition-colors';

/** Solid ink pill, as "Go to Naya Rewards" */
export const SOLID_PILL = 'inline-flex items-center justify-center gap-1.5 h-11 px-7 rounded-full bg-[#111114] text-white text-[15px] hover:bg-[#2a2a31] transition-colors';

/** Small grey underlined link, as Edit / Delete on an address */
export const TEXT_LINK = 'text-[13px] text-[#6b6b72] underline underline-offset-2 hover:text-[#111114] disabled:opacity-40 transition-colors';

export const Spinner = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-[#e6e4df] border-t-[#111114] rounded-full animate-spin" />
  </div>
);
