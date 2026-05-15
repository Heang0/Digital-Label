import type { Metadata } from 'next';
import { Inter, Outfit, Kantumruy_Pro } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/components/ui/notification';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const kantumruy = Kantumruy_Pro({
  subsets: ['khmer'],
  variable: '--font-kantumruy',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Kitzu-Tech - Elevating Retail Performance',
  description: 'Advanced Cloud Retail Infrastructure for Digital Pricing',
};

import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${kantumruy.variable}`}>
      <body className={inter.className}>
        <Providers>
          <NotificationProvider>{children}</NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
