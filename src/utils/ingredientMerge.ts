import type { ShoppingItem } from '../types';

// Common fraction patterns
const FRACTION_REGEX = /(\d+)\s*\/\s*(\d+)/;
const MIXED_REGEX = /(\d+)\s+(\d+)\s*\/\s*(\d+)/;
const DECIMAL_REGEX = /^\d+\.?\d*/;

// Units that can be merged (normalized forms)
const UNIT_ALIASES: Record<string, string> = {
  cup: 'cup', cups: 'cup',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbs: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  can: 'can', cans: 'can',
  clove: 'clove', cloves: 'clove',
  bunch: 'bunch', bunches: 'bunch',
  head: 'head', heads: 'head',
  piece: 'piece', pieces: 'piece',
  slice: 'slice', slices: 'slice',
  bottle: 'bottle', bottles: 'bottle',
  box: 'box', boxes: 'box',
  bag: 'bag', bags: 'bag',
  jar: 'jar', jars: 'jar',
  dozen: 'dozen',
  pinch: 'pinch',
  dash: 'dash',
  quart: 'quart', quarts: 'quart', qt: 'quart',
  pint: 'pint', pints: 'pint', pt: 'pint',
  gallon: 'gallon', gallons: 'gallon', gal: 'gallon',
  liter: 'liter', liters: 'liter', l: 'liter',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
};

// Category guessing based on ingredient name
const CATEGORY_KEYWORDS: Record<ShoppingItem['category'], string[]> = {
  produce: ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'potato', 'carrot', 'celery', 'cucumber', 'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana', 'berry', 'berries', 'basil', 'cilantro', 'parsley', 'mint', 'ginger', 'kale', 'spinach', 'broccoli', 'mushroom', 'corn', 'bean sprout', 'scallion', 'green onion', 'sweet potato', 'squash', 'zucchini', 'asparagus', 'cabbage', 'pea', 'fruit', 'vegetable', 'herb', 'fresh'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'ground', 'bacon', 'sausage', 'ham', 'salmon', 'fish', 'shrimp', 'tuna', 'cod', 'tilapia', 'crab', 'lobster', 'seafood', 'meat', 'fillet', 'breast', 'thigh', 'wing', 'pepperoni', 'anchovy'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'eggs', 'sour cream', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'whipping cream', 'half and half', 'cottage cheese'],
  bakery: ['bread', 'roll', 'bun', 'tortilla', 'pita', 'naan', 'croissant', 'bagel', 'baguette', 'sourdough', 'pizza dough', 'dough', 'crust'],
  frozen: ['frozen', 'ice cream'],
  pantry: ['oil', 'vinegar', 'sauce', 'paste', 'flour', 'sugar', 'salt', 'pepper', 'spice', 'seasoning', 'rice', 'pasta', 'spaghetti', 'noodle', 'can', 'broth', 'stock', 'honey', 'syrup', 'mustard', 'ketchup', 'mayo', 'soy sauce', 'coconut', 'quinoa', 'oat', 'cereal', 'crouton', 'breadcrumb', 'baking', 'vanilla', 'cinnamon', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'curry', 'chili', 'sriracha', 'tahini', 'peanut butter', 'almond butter', 'jam', 'jelly', 'nut', 'seed', 'chickpea', 'lentil', 'bean', 'canned', 'dried', 'powder'],
};

interface ParsedIngredient {
  quantity: number;
  unit: string;
  name: string;
}

function parseFraction(str: string): number {
  const mixed = str.match(MIXED_REGEX);
  if (mixed) {
    return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  }
  const frac = str.match(FRACTION_REGEX);
  if (frac) {
    return parseInt(frac[1]) / parseInt(frac[2]);
  }
  const dec = str.match(DECIMAL_REGEX);
  if (dec) {
    return parseFloat(dec[0]);
  }
  return 0;
}

function formatQuantity(num: number): string {
  if (num === 0) return '';
  const whole = Math.floor(num);
  const frac = num - whole;

  const fractions: [number, string][] = [
    [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'],
    [1 / 2, '1/2'], [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'],
  ];

  if (frac < 0.05) return String(whole || '');

  for (const [val, label] of fractions) {
    if (Math.abs(frac - val) < 0.05) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  return String(Math.round(num * 100) / 100);
}

function parseIngredient(raw: string): ParsedIngredient {
  let text = raw.trim();

  // Extract leading quantity
  let quantity = 0;
  const mixedMatch = text.match(/^(\d+\s+\d+\s*\/\s*\d+)/);
  const fracMatch = text.match(/^(\d+\s*\/\s*\d+)/);
  const decMatch = text.match(/^(\d+\.?\d*)/);

  if (mixedMatch) {
    quantity = parseFraction(mixedMatch[1]);
    text = text.slice(mixedMatch[0].length).trim();
  } else if (fracMatch) {
    quantity = parseFraction(fracMatch[1]);
    text = text.slice(fracMatch[0].length).trim();
  } else if (decMatch) {
    quantity = parseFloat(decMatch[1]);
    text = text.slice(decMatch[0].length).trim();
  }

  // Extract unit
  let unit = '';
  const unitMatch = text.match(/^([a-zA-Z]+\.?)\b/);
  if (unitMatch) {
    const candidate = unitMatch[1].replace('.', '').toLowerCase();
    if (UNIT_ALIASES[candidate]) {
      unit = UNIT_ALIASES[candidate];
      text = text.slice(unitMatch[0].length).trim();
      // Skip "of" after unit
      if (text.toLowerCase().startsWith('of ')) {
        text = text.slice(3).trim();
      }
    }
  }

  // Rest is the name — strip leading commas/spaces and trailing prep instructions
  let name = text.replace(/^[,\s]+/, '');
  // Remove parenthetical prep notes like "(diced)" or trailing ", diced"
  name = name.replace(/\s*\(.*?\)\s*/g, ' ').trim();

  return { quantity, unit, name };
}

function guessCategory(name: string): ShoppingItem['category'] {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ShoppingItem['category'], string[]][]) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return 'pantry';
}

function normalizeItemName(name: string): string {
  return name.toLowerCase().replace(/[,;].*$/, '').replace(/\s+/g, ' ').trim();
}

export function mergeIngredients(ingredientLists: string[][]): ShoppingItem[] {
  const merged = new Map<string, { quantity: number; unit: string; rawName: string }>();

  for (const list of ingredientLists) {
    for (const raw of list) {
      const parsed = parseIngredient(raw);
      const key = `${normalizeItemName(parsed.name)}|${parsed.unit}`;

      const existing = merged.get(key);
      if (existing) {
        existing.quantity += parsed.quantity;
      } else {
        merged.set(key, {
          quantity: parsed.quantity,
          unit: parsed.unit,
          rawName: parsed.name,
        });
      }
    }
  }

  const items: ShoppingItem[] = [];

  for (const { quantity, unit, rawName } of merged.values()) {
    const qtyStr = formatQuantity(quantity);
    const unitStr = unit ? ` ${unit}` : '';
    const quantityLabel = qtyStr ? `${qtyStr}${unitStr}` : '';

    items.push({
      id: crypto.randomUUID(),
      name: rawName,
      quantity: quantityLabel,
      category: guessCategory(rawName),
      checked: false,
    });
  }

  return items;
}
