import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/components/ui/notification';

const brandFont = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digital Label - Central Control for Your Chain Stores',
  description: 'Digital Price Label Management System for Retail Chains',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={brandFont.className}>
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
