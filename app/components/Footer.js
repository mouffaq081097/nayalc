'use client';

import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="mt-16 border-t border-gray-200" style={{ backgroundColor: 'var(--brand-secondary)' }}>
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Logo and Social */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="text-3xl font-serif mb-4 inline-block">
                                          <span style={{ color: 'var(--brand-blue)' }}>Naya </span>
              <span style={{ color: 'var(--brand-pink)' }}>Lumière</span>
            <p className="hidden sm:block text-xs font-sans tracking-[0.3em] uppercase -mt-1" style={{ color: 'var(--brand-muted)' }}>Cosmetics</p>
                        </Link>
                        <p className="max-w-sm" style={{ color: 'var(--brand-muted)' }}>
                            Discover the art of beauty with our exclusive collection of cosmetics, perfumes, and skincare products.
                        </p>
                    </div>
                    {/* Links */}
                    <div>
                        <h4 className="font-bold mb-4" style={{ color: 'var(--brand-text)' }}>Shop</h4>
                        <ul className="space-y-2" style={{ color: 'var(--brand-muted)' }}>
                            <li><a href="#" className="hover-brand-primary">New Arrivals</a></li>
                            <li><a href="#" className="hover-brand-primary">Best Sellers</a></li>
                            <li><Link href="/skin-care" className="hover-brand-primary">Skin Care</Link></li>
                            <li><Link href="/category/Makeup" className="hover-brand-primary">MakeUp</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4" style={{ color: 'var(--brand-text)' }}>About Us</h4>
                        <ul className="space-y-2" style={{ color: 'var(--brand-muted)' }}>
                            <li><a href="#" className="hover-brand-primary">Our Story</a></li>
                            <li><a href="#" className="hover-brand-primary">Careers</a></li>
                            <li><a href="#" className="hover-brand-primary">Press</a></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold mb-4" style={{ color: 'var(--brand-text)' }}>Support</h4>
                        <ul className="space-y-2" style={{ color: 'var(--brand-muted)' }}>
                            <li><a href="#" className="hover-brand-primary">Contact Us</a></li>
                            <li><a href="#" className="hover-brand-primary">FAQs</a></li>
                            <li><a href="#" className="hover-brand-primary">Shipping & Returns</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm" style={{ color: 'var(--brand-muted)' }}>
                    <p>&copy; {new Date().getFullYear()} Naya Lumière Cosmetics. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
