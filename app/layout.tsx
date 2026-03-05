import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'نظام إدارة المصنع',
  description: 'نظام إدارة الموارد البشرية والعملاء',
  generator: 'factory-dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`font-sans ${cairo.variable}`}>
        <SessionProvider>
          {children}
          <Analytics />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}