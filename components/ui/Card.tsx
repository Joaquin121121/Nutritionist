'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className = '', onClick, selected }: CardProps) {
  const baseStyles = 'rounded-xl p-4 transition-all duration-200';
  const interactiveStyles = onClick
    ? 'cursor-pointer active:scale-[0.98]'
    : '';
  const selectedStyles = selected
    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 shadow-sm'
    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700';

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${selectedStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
