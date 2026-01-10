'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GroceryItem } from './GroceryItem';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/data/groceries';
import type { GroceryItemData } from '@/types';

interface GroceryListProps {
  items: GroceryItemData[];
  checkedItems: Record<string, boolean>;
  onToggle: (itemKey: string) => void;
}

export function GroceryList({ items, checkedItems, onToggle }: GroceryListProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const itemsByCategory = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = items.filter((item) => item.category === category);
      return acc;
    },
    {} as Record<string, GroceryItemData[]>
  );

  return (
    <div className="space-y-4">
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = itemsByCategory[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        const isCollapsed = collapsedCategories.has(category);
        const checkedCount = categoryItems.filter(
          (item) => checkedItems[item.key]
        ).length;
        const totalCount = categoryItems.length;
        const allChecked = checkedCount === totalCount;

        return (
          <div
            key={category}
            className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {CATEGORY_LABELS[category]}
                </span>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    allChecked
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {checkedCount}/{totalCount}
                </span>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-neutral-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-neutral-500" />
              )}
            </button>

            {!isCollapsed && (
              <div className="px-2 pb-2 space-y-1">
                {categoryItems.map((item) => (
                  <GroceryItem
                    key={item.key}
                    name={item.name}
                    quantity={item.quantity}
                    checked={checkedItems[item.key] || false}
                    onToggle={() => onToggle(item.key)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
