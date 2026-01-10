'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { GroceryList, ResetButton } from '@/components/groceries';
import { GROCERY_LIST } from '@/data/groceries';
import {
  getGroceryItems,
  toggleGroceryItem,
  resetAllGroceryItems,
} from '@/lib/database';

export default function GroceriesPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadGroceryItems = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getGroceryItems();
      const checked: Record<string, boolean> = {};
      items.forEach((item) => {
        checked[item.item_key] = item.checked;
      });
      setCheckedItems(checked);
    } catch (error) {
      console.error('Error loading grocery items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroceryItems();
  }, [loadGroceryItems]);

  const handleToggle = async (itemKey: string) => {
    const newChecked = !checkedItems[itemKey];
    setCheckedItems((prev) => ({ ...prev, [itemKey]: newChecked }));

    try {
      await toggleGroceryItem(itemKey, newChecked);
    } catch (error) {
      console.error('Error toggling item:', error);
      setCheckedItems((prev) => ({ ...prev, [itemKey]: !newChecked }));
    }
  };

  const handleReset = async () => {
    setCheckedItems({});
    try {
      await resetAllGroceryItems();
    } catch (error) {
      console.error('Error resetting items:', error);
      loadGroceryItems();
    }
  };

  const totalItems = GROCERY_LIST.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const percentage = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const allDone = checkedCount === totalItems;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
          Lista de compras
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                allDone ? 'bg-primary-500' : 'bg-primary-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            {checkedCount}/{totalItems}
          </span>
        </div>
      </div>

      {/* All Done Message */}
      {allDone && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-semibold text-primary-800 dark:text-primary-200">
              Lista completa!
            </span>
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Tienes todo lo que necesitas para la semana.
            </p>
          </div>
        </div>
      )}

      {/* Grocery List */}
      <div className="mb-6">
        <GroceryList
          items={GROCERY_LIST}
          checkedItems={checkedItems}
          onToggle={handleToggle}
        />
      </div>

      {/* Reset Button */}
      <ResetButton onReset={handleReset} />
    </div>
  );
}
