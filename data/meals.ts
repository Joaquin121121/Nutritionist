import type { VariableMeal, FixedMeal } from "@/types";

export const VARIABLE_MEALS: VariableMeal[] = [
  {
    id: "balanced_lunch",
    name: "Almuerzo balanceado",
    emoji: "🥗",
    weeklyServings: 7,
  },
  {
    id: "balanced_dinner",
    name: "Cena balanceada",
    emoji: "🍽️",
    weeklyServings: 7,
  },
];

export const FIXED_MEALS: FixedMeal[] = [
  { id: "shake", name: "Batido", emoji: "🥤" },
  { id: "banana", name: "Banana", emoji: "🍌" },
  { id: "apple", name: "Manzana", emoji: "🍎" },
  {
    id: "yogurt_strawberries",
    name: "Yogur griego con frutillas y cereales",
    emoji: "🍓",
  },
  { id: "scrambled_eggs", name: "Huevos/Whey", emoji: "🍳" },
];

export const DEFAULT_FIXED_MEALS: Record<string, boolean> = {
  shake: false,
  banana: false,
  apple: false,
  yogurt_strawberries: false,
  scrambled_eggs: false,
};
