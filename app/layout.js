'use client';
import "./globals.css";
import Providers from './Providers';
import LayoutContent from './LayoutContent';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>nayalc.com - Your Premier Destination for Beauty and Skincare in the UAE</title>
        <meta name="description" content="Discover a wide range of beauty and skincare products, from fragrances to gift sets and new arrivals. Shop online for all your beauty and personal care needs in the UAE." />
        <meta name="keywords" content="beauty, skincare, fragrance, gift sets, UAE, online shopping" />
        <meta property="og:title" content="nayalc.com - Your Premier Destination for Beauty and Skincare in the UAE" />
        <meta property="og:description" content="Discover a wide range of beauty and skincare products, from fragrances to gift sets and new arrivals. Shop online for all your beauty and personal care needs in the UAE." />
        <meta property="og:image" content="/public/2.jpg" />
        <meta property="og:url" content="https://nayalc.com" />
        <link rel="icon" href="/favicon.jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
