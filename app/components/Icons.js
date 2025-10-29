import React from 'react';

// FIX: Removed invalid 'alt' attribute from svg element. The 'alt' attribute is not valid for SVG elements.
export const UaeFlagIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className={className}>
    <g clipPath="url(#uae-flag-clip)"><path fill="#00732F" d="M9 18A9 9 0 1 0 9 0a9 9 0 0 0 0 18"></path><path fill="#F4F4F4" d="M9 18a9 9 0 0 0 8.488-12H.512A9 9 0 0 0 9 18"></path><path fill="#000" d="M17.488 12A9.004 9.004 0 0 1 .512 12z"></path><path fill="red" d="M5.75.605a9.003 9 0 0 0 0 16.79z"></path></g>
    <defs><clipPath id="uae-flag-clip"><rect width="18" height="18" fill="#fff" rx="9"></rect></clipPath></defs>
  </svg>
);

export const StoreIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

export const AngleDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const CatalogIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const ProfileIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const HeartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
  </svg>
);

export const CartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const AngleLeftIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

export const AngleRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

export const NayaLumiereLogo = ({ className }) => (
    <svg viewBox="0 0 230 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#E7C668', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <image href="/favicon.jpeg" x="0" y="0" height="40" width="40" />
        <text x="50" y="24" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="20" fontWeight="600" fill="#2d3748">
            NAYA
        </text>
        <text x="120" y="24" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="20" fontWeight="300" letterSpacing="1" fill="#4a5568">
            LUMIERE
        </text>
        <text x="50" y="35" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="9" fontWeight="300" fill="#6b7280" textLength="150" lengthAdjust="spacing">
            COSMETICS
        </text>
    </svg>
);