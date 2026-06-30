'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Brain, Headphones, Target } from 'lucide-react';

// Track & Progress are merged into a single tab. Day-logging happens in a
// modal opened from within the merged page.
const tabs = [
  { href: '/track', label: 'Progress', icon: TrendingUp },
  { href: '/basketball', label: 'Hoops', icon: Target },
  { href: '/deep-work', label: 'Focus', icon: Brain },
  { href: '/audiobook', label: 'Audio', icon: Headphones },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="tabbar pb-safe">
      <div className="tabbar-inner">
        {tabs.map((tab) => {
          // The merged tab also covers the legacy standalone /progress route.
          const isActive =
            pathname === tab.href ||
            (tab.href === '/track' && pathname === '/progress');
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
