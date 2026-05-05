'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        
        {/* Top Section: Newsletter & Brand */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-16 mb-20">
          
          {/* Brand & Newsletter */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link href="/" className="flex items-center gap-2.5 mb-6 transition-all active:scale-95 group">
                <Image
                  src="/Adobe Express - file (5).png"
                  alt="Naya Lumière Cosmetics"
                  height={40}
                  width={130}
                  className="h-10 w-auto object-contain shrink-0"
                />
                <div className="flex flex-col text-left leading-tight">
                    <span
                      className="text-[17px] md:text-[19px] font-bold tracking-[0.08em] uppercase"
                      style={{ 
                        color: '#3b0764', 
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        textShadow: 'none',
                      }}
                    >
                      NAYA
                    </span>
                    <span
                      className="text-[11px] md:text-[12px] italic mt-0.5"
                      style={{ 
                        fontFamily: "Georgia, 'Times New Roman', serif", 
                        color: '#6b21a8',
                        textShadow: 'none',
                      }}
                    >
                      Lumière Cosmetics
                    </span>
                </div>
            </Link>
            <p className="text-[13px] text-gray-500 max-w-md leading-relaxed mb-8 font-medium">
              Join our exclusive journal for early access to seasonal previews, botanical insights, and private boutique events.
            </p>
            
            <form className="w-full max-w-md relative flex items-center" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-gray-50 border border-gray-200 text-black text-[13px] rounded-full px-6 py-4 outline-none focus:border-[var(--cl-purple)] transition-colors placeholder:text-gray-400"
              />
              <button 
                type="submit" 
                className="cl-gradient-btn absolute right-2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 border-none shadow-none"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Essential Links */}
          <div className="flex gap-16 sm:gap-24 text-center lg:text-left">
            <div className="flex flex-col gap-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-black">Boutique</h3>
              <div className="flex flex-col gap-4">
                <Link href="/all-products" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">All Products</Link>
                <Link href="/SkinCare" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">Skincare</Link>
                <Link href="/fragrance" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">Fragrance</Link>
                <Link href="/new-arrivals" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">New Arrivals</Link>
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-black">House</h3>
              <div className="flex flex-col gap-4">
                <Link href="#" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">Our Story</Link>
                <Link href="#" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">Contact</Link>
                <Link href="/account" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">Account</Link>
                <Link href="/orders" className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors">Orders</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-100">
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-[12px] text-gray-400 font-medium">© 2026 Naya Lumière Cosmetics Inc.</p>
            <div className="flex items-center gap-6 text-[12px] text-gray-400 font-medium">
              <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-black transition-colors">Terms of Service</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-300 hover:bg-white transition-all">
              <Instagram size={16} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-300 hover:bg-white transition-all">
              <Twitter size={16} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-300 hover:bg-white transition-all">
              <Facebook size={16} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
