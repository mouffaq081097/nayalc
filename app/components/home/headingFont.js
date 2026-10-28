import { Montserrat } from 'next/font/google';

// The storefront's display face: uppercase Montserrat for section titles,
// banner headlines and the closing line, after Pitaka's clean wide sans.
// Its own module (not SectionHeading, a client component) so server
// components can use the class string too.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-montserrat',
});

// `.font-heading` (globals.css) is Montserrat, and the Arabic face in Arabic
export const headingFont = `${montserrat.variable} font-heading`;
