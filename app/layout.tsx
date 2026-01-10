import type { Metadata, Viewport } from 'next';
import { BottomNav } from '@/components/navigation/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meal Tracker',
  description: 'Track your meals and groceries',
  manifest: '/manifest.json',
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
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <main className="min-h-screen pb-20">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
