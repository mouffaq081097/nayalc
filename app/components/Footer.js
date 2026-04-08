'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col gap-4">
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cl-deep mb-2">{title}</h3>
    <ul className="flex flex-col gap-3">
      {links.map((link) => (
        <li key={link.text}>
          <Link href={link.href} className="text-[12px] font-medium text-cl-mid hover:text-cl-purple transition-colors flex items-center gap-1.5 group">
            <ChevronRight size={10} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            {link.text}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default function Footer() {
  const footerLinks = {
    shop: [
      { text: 'All Products', href: '/all-products' },
      { text: 'New Arrivals', href: '/new-arrivals' },
      { text: 'Skincare', href: '/SkinCare' },
      { text: 'Fragrance', href: '/fragrance' },
      { text: 'Sales', href: '/sales' },
    ],
    services: [
      { text: 'Naya Intelligence', href: '#' },
      { text: 'Personal Consultation', href: '#' },
      { text: 'Gift Wrapping', href: '#' },
      { text: 'Naya Care+', href: '#' },
      { text: 'Order Status', href: '/orders' },
    ],
    account: [
      { text: 'Manage Your ID', href: '/account' },
      { text: 'Naya Store Account', href: '/account' },
      { text: 'NayaCloud', href: '#' },
    ],
    about: [
      { text: 'Newsroom', href: '#' },
      { text: 'Naya Leadership', href: '#' },
      { text: 'Career Opportunities', href: '#' },
      { text: 'Investors', href: '#' },
      { text: 'Ethics & Compliance', href: '#' },
      { text: 'Events', href: '#' },
    ],
    values: [
      { text: 'Accessibility', href: '#' },
      { text: 'Environment', href: '#' },
      { text: 'Privacy', href: '#' },
      { text: 'Supply Chain', href: '#' },
    ]
  };

  return (
    <footer className="cl-section-lavender text-cl-light text-[11px] font-sans border-t border-[var(--cl-glass-border)]/50 relative overflow-hidden">
      {/* Cloud Luxe aura orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="cl-aura cl-aura-purple" style={{ width: 400, height: 400, top: '-10%', left: '-10%', opacity: 0.15 }} />
        <div className="cl-aura cl-aura-rose" style={{ width: 300, height: 300, bottom: '-10%', right: '-10%', opacity: 0.1 }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Links Grid - Cloud Luxe Style */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-12 gap-x-8 mb-16">
            <FooterColumn title="Shop and Learn" links={footerLinks.shop} />
            <FooterColumn title="Concierge Services" links={footerLinks.services} />
            <div className="flex flex-col gap-10">
                <FooterColumn title="Account" links={footerLinks.account} />
                <FooterColumn title="Lumière Store" links={[
                    { text: 'Find a Boutique', href: '#' },
                    { text: 'Expert Consultation', href: '#' },
                    { text: 'Today at Naya', href: '#' },
                ]} />
            </div>
            <div className="flex flex-col gap-10">
                <FooterColumn title="For Professionals" links={[
                    { text: 'Naya for Business', href: '#' },
                    { text: 'Spa Partnerships', href: '#' },
                ]} />
                 <FooterColumn title="Educational" links={[
                    { text: 'Beauty & Wellness', href: '#' },
                    { text: 'Skincare Guide', href: '#' },
                ]} />
            </div>
            <div className="flex flex-col gap-10">
                <FooterColumn title="Our Values" links={footerLinks.values} />
                <FooterColumn title="About Naya" links={footerLinks.about} />
            </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-10 border-t border-[var(--cl-glass-border)]/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-3">
                    <p className="text-cl-muted text-[10px] font-medium tracking-wide">Copyright © 2026 Naya Lumière Cosmetics Inc. All rights reserved.</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-cl-mid font-semibold tracking-tight">
                        <Link href="#" className="hover:text-cl-purple transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-cl-purple transition-colors">Terms of Use</Link>
                        <Link href="#" className="hover:text-cl-purple transition-colors">Sales Policy</Link>
                        <Link href="#" className="hover:text-cl-purple transition-colors">Legal</Link>
                        <Link href="#" className="hover:text-cl-purple transition-colors">Site Map</Link>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--cl-glass-border)] bg-white/40 text-cl-deep font-bold tracking-tight">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        United Arab Emirates
                    </div>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
}
