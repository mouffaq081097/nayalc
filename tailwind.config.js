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
        'serif': ['"Playfair Display"', 'serif'],
        'sans': ['"Inter"', 'sans-serif'],
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
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-urgent': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple-urgent': 'ripple 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [aspectRatio, lineClamp],
}