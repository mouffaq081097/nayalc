/** @type {import('tailwindcss').Config} */
import aspectRatio from '@tailwindcss/aspect-ratio';
import lineClamp from '@tailwindcss/line-clamp';
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Cloud Luxe palette */
        'cl-purple': 'var(--cl-purple)',
        'cl-purple-light': 'var(--cl-purple-light)',
        'cl-purple-deep': 'var(--cl-purple-deep)',
        'cl-pink': 'var(--cl-pink)',
        'cl-pink-light': 'var(--cl-pink-light)',
        'cl-bg': 'var(--cl-bg)',
        'cl-bg-rose': 'var(--cl-bg-rose)',
        'cl-bg-lavender': 'var(--cl-bg-lavender)',
        'cl-glass': 'var(--cl-glass)',
        'cl-glass-border': 'var(--cl-glass-border)',
        'cl-deep': 'var(--cl-text-deep)',
        'cl-mid': 'var(--cl-text-mid)',
        'cl-soft': 'var(--cl-text-soft)',
        'cl-light': 'var(--cl-text-light)',
        'cl-muted': 'var(--cl-text-muted)',
        /* brand */
        'brand-blue': 'var(--brand-blue)',
        'brand-blue-light': 'var(--brand-blue-light)',
        'brand-blue-extra-light': 'var(--brand-blue-extra-light)',
        'brand-pink': 'var(--brand-pink)',
        'brand-pink-light': 'var(--brand-pink-light)',
        'brand-pink-extra-light': 'var(--brand-pink-extra-light)',
        'brand-background': 'var(--brand-background)',
        'brand-text': 'var(--brand-text)',
        'brand-secondary': 'var(--brand-secondary)',
        'brand-muted': 'var(--brand-muted)',
        'brand-highlight-bg': 'var(--brand-highlight-bg)',
        'brand-premium-bg': 'var(--brand-premium-bg)',
        'brand-primary': 'var(--brand-primary)',
        'brand-gray-100': 'var(--brand-gray-100)',
        'brand-button-bg': 'var(--brand-button-bg)',
      },
      fontFamily: {
        'serif': ['var(--font-cormorant)', 'serif'],
        'sans': ['var(--font-instrument)', 'var(--font-montserrat)', 'sans-serif'],
        'instrument': ['var(--font-instrument)', 'sans-serif'],
        'playfair': ['var(--font-playfair)', 'serif'],
        'cinzel': ['var(--font-cinzel)', 'serif'],
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.08)',
        'luxury': '0 30px 60px -15px rgba(147, 51, 234, 0.10)',
        'cl-card': '0 8px 32px rgba(124, 58, 237, 0.14)',
        'cl-card-hover': '0 20px 48px rgba(124, 58, 237, 0.28)',
        'cl-glow': '0 0 40px rgba(124, 58, 237, 0.28)',
        'cl-btn': '0 8px 24px rgba(124, 58, 237, 0.38)',
      },
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        md: '0 4px 6px var(--tw-shadow-color)',
        lg: '0 8px 10px var(--tw-shadow-color)',
        xl: '0 10px 15px var(--tw-shadow-color)',
        none: 'none',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        ripple: {
          '0%': {
            transform: 'scale(0.5)',
            opacity: 1,
          },
          '100%': {
            transform: 'scale(1.5)',
            opacity: 0,
          },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        'cl-aura-float': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '33%': { transform: 'translateY(-18px) scale(1.04)' },
          '66%': { transform: 'translateY(10px) scale(0.97)' },
        },
        'cl-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-urgent': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple-urgent': 'ripple 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-in-out forwards',
        shimmer: 'shimmer 2s infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'cl-aura-float': 'cl-aura-float 10s ease-in-out infinite',
        'cl-aura-float-slow': 'cl-aura-float 14s ease-in-out infinite',
        'cl-shimmer': 'cl-shimmer 3s linear infinite',
      },
    },
  },
  plugins: [aspectRatio, lineClamp],
}