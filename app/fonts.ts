import { Geist as GeistFont } from 'next/font/google';

export const Geist = GeistFont({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-geist',
  display: 'swap',
});
