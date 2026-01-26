import type { GroceryItemData } from "@/types";

export const GROCERY_LIST: GroceryItemData[] = [
  // Proteinas
  {
    key: "pechuga_pollo",
    name: "Pechuga de Pollo Deshuesada",
    quantity: "2kg",
    category: "proteinas",
  },
  { key: "atun", name: "Atun", quantity: "3 latas", category: "proteinas" },
  {
    key: "huevos",
    name: "Huevos",
    quantity: "24 unidades",
    category: "proteinas",
  },

  // Carbohidratos
  {
    key: "macarrones",
    name: "Macarrones",
    quantity: "1 paquete (500g)",
    category: "carbohidratos",
  },
  { key: "arroz", name: "Arroz", quantity: "1kg", category: "carbohidratos" },
  {
    key: "lentejas",
    name: "Hamburguesas de Lentejas",
    quantity: "3",
    category: "carbohidratos",
  },
  {
    key: "pan",
    name: "Pan grande o dos chicos",
    quantity: "1-2",
    category: "carbohidratos",
  },
  {
    key: "avena",
    name: "Avena",
    quantity: "1 paquete",
    category: "carbohidratos",
  },

  // Verduras
  { key: "broccoli", name: "Brocoli", quantity: "1kg", category: "verduras" },
  { key: "espinaca", name: "Espinaca", quantity: "1kg", category: "verduras" },
  {
    key: "zanahorias",
    name: "Zanahorias",
    quantity: "1kg",
    category: "verduras",
  },
  {
    key: "zanahorias",
    name: "Zanahorias",
    quantity: "1kg",
    category: "verduras",
  },

  // Frutas
  {
    key: "bananas",
    name: "Bananas (no mas de 8)",
    quantity: "8",
    category: "frutas",
  },
  { key: "manzanas", name: "Manzanas", quantity: "4", category: "frutas" },
  {
    key: "frutillas",
    name: "Frutillas",
    quantity: "600g (~20)",
    category: "frutas",
  },

  // Lacteos
  {
    key: "yogur_griego",
    name: "Yogur griego",
    quantity: "7",
    category: "lacteos",
  },
  {
    key: "queso_rallado",
    name: "Queso rallado",
    quantity: "1 paquete",
    category: "lacteos",
  },
  {
    key: "queso_cremoso",
    name: "Queso cremoso",
    quantity: "1",
    category: "lacteos",
  },
  { key: "leche", name: "Leche", quantity: "1 litro", category: "lacteos" },

  // Otros
  {
    key: "salsa_soja",
    name: "Salsa de soja",
    quantity: "1 botella",
    category: "otros",
  },
  { key: "cacao", name: "Cacao", quantity: "1 paquete", category: "otros" },
  {
    key: "pasta_mani",
    name: "Pasta de mani",
    quantity: "1 frasco",
    category: "otros",
  },

  // Suplementos
  { key: "creatina", name: "Creatina", quantity: "1", category: "suplementos" },

  // Snacks
  {
    key: "barras_zafran",
    name: "Barras Zafran",
    quantity: "1 caja",
    category: "snacks",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  proteinas: "🥩 Proteinas",
  carbohidratos: "🍚 Carbohidratos",
  verduras: "🥦 Verduras",
  frutas: "🍎 Frutas",
  lacteos: "🥛 Lacteos",
  otros: "🧂 Otros",
  suplementos: "💪 Suplementos",
  snacks: "🍫 Snacks",
};

export const CATEGORY_ORDER = [
  "proteinas",
  "carbohidratos",
  "verduras",
  "frutas",
  "lacteos",
  "otros",
  "suplementos",
  "snacks",
];
