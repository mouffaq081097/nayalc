import "./globals.css";
import Providers from './Providers';
import LayoutContent from './LayoutContent';

export const metadata = {
  metadataBase: new URL('https://nayalc.com'),
  title: {
    default: "nayalc.com - Premier Beauty & Skincare in UAE",
    template: "%s | nayalc.com"
  },
  description: "Discover luxury beauty and skincare at nayalc.com. Shop top-tier fragrances, night creams, serums, and gift sets. Your destination for personal care in the UAE.",
  keywords: ["beauty", "skincare", "fragrance", "gift sets", "UAE", "online shopping", "night cream", "serum", "luxury beauty", "Dubai skincare"],
  authors: [{ name: 'nayalc.com' }],
  creator: 'nayalc.com',
  publisher: 'nayalc.com',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "nayalc.com - Premier Beauty & Skincare in UAE",
    description: "Discover luxury beauty and skincare products in the UAE. Shop fragrances, serums, and more.",
    url: "https://nayalc.com",
    siteName: "nayalc.com",
    images: [
      {
        url: "/public/2.jpg",
        width: 1200,
        height: 630,
        alt: 'nayalc.com - Luxury Beauty Store',
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "nayalc.com - Premier Beauty & Skincare in UAE",
    description: "Discover luxury beauty and skincare products in the UAE.",
    images: ["/public/2.jpg"],
  },
  icons: {
    icon: "/favicon.jpeg",
    shortcut: "/favicon.jpeg",
    apple: "/favicon.jpeg",
  },
  alternates: {
    canonical: '/',
  },
  category: 'beauty',
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'nayalc.com',
    url: 'https://nayalc.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://nayalc.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
