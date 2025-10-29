/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': 'var(--brand-blue)',
        'brand-pink': 'var(--brand-pink)',
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
      }
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio'), require('@tailwindcss/line-clamp')],
}