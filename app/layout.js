import "./globals.css";
import {
  Inter,
  IBM_Plex_Sans_Arabic,
} from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
import Providers from './Providers';
import { LocaleProvider } from './context/LocaleContext';
import { LOCALE_SCRIPT } from '@/lib/i18n';

// The Arabic version's face (lib/i18n); browsers only download it when Arabic text is on the page
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
});
import { INSTAGRAM_URL } from '@/lib/seo';
import LayoutContent from './LayoutContent';
import VisitTracker from './components/VisitTracker';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL('https://nayalc.com'),
  title: {
    default: "Naya Lumière Cosmetics | Luxury Beauty & Skincare UAE",
    template: "%s | Naya Lumière Cosmetics"
  },
  description: "Shop luxury beauty and skincare in the UAE at Naya Lumière Cosmetics. Official retailer of GERnétic, Zorah, and Naya Lumière Perfumes. Free delivery on orders of 3 items or more.",
  keywords: ["luxury skincare UAE", "GERnétic Dubai", "Zorah beauty", "Naya Lumière Perfumes", "beauty store Dubai", "skincare online UAE", "night cream UAE", "luxury serum Dubai", "fragrance UAE", "gift sets Dubai", "bio-cosmetics UAE"],
  authors: [{ name: 'Naya Lumière Cosmetics' }],
  creator: 'Naya Lumière Cosmetics',
  publisher: 'Naya Lumière Cosmetics',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Naya Lumière Cosmetics | Luxury Beauty & Skincare UAE",
    description: "Official retailer of GERnétic, Zorah, and Naya Lumière Perfumes. Shop luxury skincare, fragrances, and gift sets with free UAE delivery.",
    url: "https://nayalc.com",
    siteName: "Naya Lumière Cosmetics",
    images: [
      {
        url: "/Adobe Express - file (12).png",
        width: 1200,
        height: 630,
        alt: 'Naya Lumière Cosmetics - Luxury Beauty & Skincare Store UAE',
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Naya Lumière Cosmetics | Luxury Beauty & Skincare UAE",
    description: "Official retailer of GERnétic, Zorah & Naya Lumière Perfumes. Shop luxury skincare & fragrance with free UAE delivery.",
    images: ["/Adobe Express - file (12).png"],
  },
  icons: {
    icon: "/Adobe Express - file (5).png",
    shortcut: "/Adobe Express - file (5).png",
    apple: "/Adobe Express - file (5).png",
  },
  category: 'beauty',
};

export default function RootLayout({ children }) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Naya Lumière Cosmetics',
      url: 'https://nayalc.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://nayalc.com/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'OnlineStore'],
      name: 'Naya Lumière Cosmetics',
      url: 'https://nayalc.com',
      logo: 'https://nayalc.com/Adobe%20Express%20-%20file%20(5).png',
      description: 'Luxury beauty and skincare destination in the UAE. Official retailer of GERnétic, Zorah, and Naya Lumière Perfumes.',
      areaServed: {
        '@type': 'Country',
        name: 'United Arab Emirates',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Arabic'],
      },
      sameAs: [
        INSTAGRAM_URL,
      ],
    },
  ];

  const fontVars = [inter.variable, plexArabic.variable].join(' ');

  return (
    // LOCALE_SCRIPT switches <html lang dir> for Arabic visitors before the first paint
    <html lang="en" dir="ltr" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd[0]) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd[1]) }}
        />
      </head>
      <body className="antialiased">
        {/* Covers the English page for Arabic visitors until the Arabic text is in (globals.css) */}
        <div className="i18n-splash latin" aria-hidden="true" />
        <LocaleProvider>
          <Providers>
            <VisitTracker />
            <LayoutContent>{children}</LayoutContent>
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
