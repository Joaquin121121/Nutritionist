import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { BottomNav } from '@/components/navigation/BottomNav';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Progress Tracker',
  description: 'Track your meals and groceries',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meals',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f4f1ea',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="antialiased">
        <main className="min-h-screen pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
