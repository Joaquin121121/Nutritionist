'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, TrendingUp, Brain, Headphones } from 'lucide-react';

const tabs = [
  { href: '/track', label: 'Track', icon: Utensils },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/deep-work', label: 'Focus', icon: Brain },
  { href: '/audiobook', label: 'Audio', icon: Headphones },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="tabbar pb-safe">
      <div className="tabbar-inner">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tab${isActive ? ' active' : ''}`}
            >
              <Icon width={23} height={23} strokeWidth={isActive ? 2.1 : 1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
