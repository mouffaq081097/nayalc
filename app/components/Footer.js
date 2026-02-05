'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-[12px] font-semibold text-[#1d1d1f] mb-1">{title}</h3>
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.text}>
          <Link href={link.href} className="text-[11px] text-[#424245] hover:underline">
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
    <footer className="bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-sans">
      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-10">
        
        {/* Top Disclaimer Section */}
        <div className="border-b border-[#d2d2d7] pb-6 mb-6 text-[#6e6e73] space-y-3">
            <p>1. Special pricing available for qualified purchasers only. Qualified purchasers include students, educators, and staff. Quantity limits apply.</p>
            <p>2. Subscription required for Naya Intelligence features. Trial available for new members.</p>
            <p>We use your location to show you delivery options faster. We found your location using your IP address or because you entered it during a previous visit to Naya.</p>
        </div>

        {/* Links Grid - Apple Style: 5 Columns on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-4 mb-10">
            <FooterColumn title="Shop and Learn" links={footerLinks.shop} />
            <FooterColumn title="Services" links={footerLinks.services} />
            <div className="flex flex-col gap-8">
                <FooterColumn title="Account" links={footerLinks.account} />
                <FooterColumn title="Naya Store" links={[
                    { text: 'Find a Store', href: '#' },
                    { text: 'Genius Bar', href: '#' },
                    { text: 'Today at Naya', href: '#' },
                ]} />
            </div>
            <div className="flex flex-col gap-8">
                <FooterColumn title="For Business" links={[
                    { text: 'Naya and Business', href: '#' },
                    { text: 'Shop for Business', href: '#' },
                ]} />
                 <FooterColumn title="For Education" links={[
                    { text: 'Naya and Education', href: '#' },
                    { text: 'Shop for K-12', href: '#' },
                    { text: 'Shop for College', href: '#' },
                ]} />
            </div>
            <div className="flex flex-col gap-8">
                <FooterColumn title="Naya Values" links={footerLinks.values} />
                <FooterColumn title="About Naya" links={footerLinks.about} />
            </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6">
            <div className="flex items-center gap-1 text-[#424245] mb-2 pb-2 border-b border-[#d2d2d7] md:border-none">
                More ways to shop: <Link href="#" className="text-[#0066cc] hover:underline">Find an Naya Store</Link> or <Link href="#" className="text-[#0066cc] hover:underline">other retailer</Link> near you. Or call 800-MY-NAYA.
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 md:pt-4 border-t border-[#d2d2d7]">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <p className="text-[#6e6e73]">Copyright © 2026 Naya Lumière Inc. All rights reserved.</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#424245]">
                        <Link href="#" className="hover:underline">Privacy Policy</Link>
                        <span className="text-[#d2d2d7] hidden md:inline">|</span>
                        <Link href="#" className="hover:underline">Terms of Use</Link>
                        <span className="text-[#d2d2d7] hidden md:inline">|</span>
                        <Link href="#" className="hover:underline">Sales and Refunds</Link>
                        <span className="text-[#d2d2d7] hidden md:inline">|</span>
                        <Link href="#" className="hover:underline">Legal</Link>
                        <span className="text-[#d2d2d7] hidden md:inline">|</span>
                        <Link href="#" className="hover:underline">Site Map</Link>
                    </div>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap text-[#424245]">
                    <span className="hover:underline cursor-pointer">United Arab Emirates</span>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
}