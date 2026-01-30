import type { VariableMeal, FixedMeal } from "@/types";

export const VARIABLE_MEALS: VariableMeal[] = [
  {
    id: "chicken_pumpkin",
    name: "Pollo con pure de calabaza",
    emoji: "🍗",
    weeklyServings: 4,
  },
  {
    id: "chicken_pasta_broccoli",
    name: "Pollo con pasta, brocoli y queso",
    emoji: "🥦",
    weeklyServings: 2,
  },
  {
    id: "chicken_pasta_spinach",
    name: "Pollo con pasta, espinaca y queso",
    emoji: "🥬",
    weeklyServings: 2,
  },
  {
    id: "tuna_rice",
    name: "Arroz con atun y zanahorias",
    emoji: "🐟",
    weeklyServings: 2,
  },
  {
    id: "lentil_burgers",
    name: "Hamburguesas de lentejas con broccoli",
    emoji: "🍔",
    weeklyServings: 2,
  },
  {
    id: "gohan_zanahoria",
    name: "Gohan con zanahoria",
    emoji: "🍚",
    weeklyServings: 0,
  },
];

export const FIXED_MEALS: FixedMeal[] = [
  { id: "shake", name: "Batido", emoji: "🥤" },
  { id: "banana", name: "Banana", emoji: "🍌" },
  { id: "apple", name: "Manzana", emoji: "🍎" },
  {
    id: "yogurt_strawberries",
    name: "Yogur griego con frutillas",
    emoji: "🍓",
  },
  { id: "scrambled_eggs", name: "Huevos revueltos con tostada", emoji: "🍳" },
];

export const DEFAULT_FIXED_MEALS: Record<string, boolean> = {
  shake: false,
  banana: false,
  apple: false,
  yogurt_strawberries: false,
  scrambled_eggs: false,
};
