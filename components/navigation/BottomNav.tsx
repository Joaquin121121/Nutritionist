'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, TrendingUp, ShoppingCart } from 'lucide-react';

const tabs = [
  { href: '/track', label: 'Track', icon: Utensils },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/groceries', label: 'Groceries', icon: ShoppingCart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
