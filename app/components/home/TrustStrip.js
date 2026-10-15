import { ShieldCheck, Truck, Banknote, Gift } from 'lucide-react';
import { TRANSIT_LABEL, TRANSIT_SHORT_LABEL, FREE_SHIPPING_FROM } from '../../../lib/shipping';

const LAVENDER = 'rgb(147,104,236)';

// Facts only, each from the setting it describes, so the strip can't drift from checkout.
// `short` is the phone label — one compact row of four, so it has to fit two short lines.
const ITEMS = [
  { Icon: ShieldCheck, title: '100% authentic', short: '100% authentic', text: 'Genuine brand products' },
  { Icon: Truck, title: `Delivery in ${TRANSIT_LABEL}`, short: TRANSIT_SHORT_LABEL, text: 'Tracked, across the UAE' },
  { Icon: Banknote, title: 'Cash on delivery & Tabby', short: 'Cash on delivery & Tabby', text: 'Or pay by card' },
  { Icon: Gift, title: `Free shipping on ${FREE_SHIPPING_FROM}+ items`, short: `Free shipping on ${FREE_SHIPPING_FROM}+`, text: 'Any products, any brand' },
];

/** The four questions a first-time buyer has, answered right under the hero. */
export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="bg-white" style={{ borderBottom: '1px solid #f1ecfb' }}>
      <ul className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3.5 md:py-5 grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-x-1 md:gap-x-4 md:gap-y-4">
        {ITEMS.map(({ Icon, title, short, text }) => (
          <li key={title} className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 min-w-0 text-center md:text-left">
            <span className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f3f4f6' }}>
              <Icon className="w-4 h-4 md:w-[17px] md:h-[17px]" style={{ color: LAVENDER }} strokeWidth={1.75} />
            </span>
            {/* Phones: one short label under the icon */}
            <span className="md:hidden text-[10.5px] font-medium text-gray-700 leading-[1.25] px-0.5 text-balance">{short}</span>
            {/* Tablet and up: title plus the supporting line */}
            <span className="hidden md:block min-w-0">
              <span className="block text-[13px] font-semibold text-gray-900 leading-snug">{title}</span>
              <span className="block text-[12px] text-gray-500 leading-snug">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
