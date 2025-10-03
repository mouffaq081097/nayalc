'use client';
import "./globals.css";
import { Providers } from './Providers';
import LayoutContent from './LayoutContent';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
