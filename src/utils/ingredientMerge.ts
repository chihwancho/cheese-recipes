import { parseIngredient } from 'parse-ingredient';
import type { ShoppingItem } from '../types';

type Category = ShoppingItem['category'];

const CATEGORY_ORDER: Category[] = ['produce', 'meat', 'dairy', 'bakery', 'frozen', 'pantry'];

// Category guessing based on ingredient name (fallback when AI is not used)
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  produce: ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'potato', 'carrot', 'celery', 'cucumber', 'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana', 'berry', 'berries', 'basil', 'cilantro', 'parsley', 'mint', 'ginger', 'kale', 'spinach', 'broccoli', 'mushroom', 'corn', 'bean sprout', 'scallion', 'green onion', 'sweet potato', 'squash', 'zucchini', 'asparagus', 'cabbage', 'pea', 'fruit', 'vegetable', 'herb', 'fresh'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'ground beef', 'ground turkey', 'ground pork', 'ground chicken', 'ground lamb', 'ground meat', 'bacon', 'sausage', 'ham', 'salmon', 'fish', 'shrimp', 'tuna', 'cod', 'tilapia', 'crab', 'lobster', 'seafood', 'meat', 'fillet', 'breast', 'thigh', 'wing', 'pepperoni', 'anchovy'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'eggs', 'sour cream', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'whipping cream', 'half and half', 'cottage cheese'],
  bakery: ['bread', 'roll', 'bun', 'tortilla', 'pita', 'naan', 'croissant', 'bagel', 'baguette', 'sourdough', 'pizza dough', 'dough', 'crust'],
  frozen: ['frozen', 'ice cream'],
  pantry: ['oil', 'vinegar', 'sauce', 'paste', 'flour', 'sugar', 'salt', 'pepper', 'spice', 'seasoning', 'rice', 'pasta', 'spaghetti', 'noodle', 'can', 'broth', 'stock', 'honey', 'syrup', 'mustard', 'ketchup', 'mayo', 'soy sauce', 'coconut', 'quinoa', 'oat', 'cereal', 'crouton', 'breadcrumb', 'baking', 'vanilla', 'cinnamon', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'curry', 'chili', 'sriracha', 'tahini', 'peanut butter', 'almond butter', 'jam', 'jelly', 'nut', 'seed', 'chickpea', 'lentil', 'bean', 'canned', 'dried', 'powder'],
};

function guessCategory(name: string): Category {
  const lower = name.toLowerCase();
  let bestMatch: { category: Category; length: number } | null = null;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        if (!bestMatch || keyword.length > bestMatch.length) {
          bestMatch = { category, length: keyword.length };
        }
      }
    }
  }

  return bestMatch?.category ?? 'pantry';
}

function cleanRawText(raw: string): string {
  let text = raw.trim();
  // Strip leading bullets, asterisks, dashes, periods, list markers
  text = text.replace(/^[\s*•·.▪–—-]+/, '').trim();
  // Strip trailing asterisks, footnote markers, or other markup
  text = text.replace(/[*†‡]+$/, '').trim();
  // Strip trailing price annotations like ($3 7/8)
  text = text.replace(/\s*\(\$[\d\s./]+\)\s*$/, '').trim();
  return text;
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

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ')  // remove parentheticals
    .replace(/[,;].*$/, '')           // strip after commas/semicolons
    .replace(/[*†‡]+$/, '')           // footnote markers
    .replace(/\s+/g, ' ')
    .trim();
}

function sortItems(items: ShoppingItem[]): ShoppingItem[] {
  return items.sort((a, b) => {
    const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/**
 * Library-based ingredient merge (synchronous, no API needed).
 * Uses parse-ingredient for parsing, then merges by normalized name.
 */
export function mergeIngredients(ingredientLists: string[][]): ShoppingItem[] {
  const allRaw = ingredientLists.flat().map(cleanRawText).filter(Boolean);
  const parsed = parseIngredient(allRaw.join('\n'), { normalizeUOM: true });

  // Group by normalized description, then by unit
  const byName = new Map<string, { parts: { quantity: number; unit: string }[]; rawName: string }>();

  for (const item of parsed) {
    if (item.isGroupHeader) continue;

    const desc = item.description;
    const qty = item.quantity2 ?? item.quantity ?? 0; // use upper range if present
    const unit = item.unitOfMeasureID ?? '';
    const key = normalizeDescription(desc);

    const existing = byName.get(key);
    if (existing) {
      const samePart = existing.parts.find((p) => p.unit === unit);
      if (samePart) {
        samePart.quantity += qty;
      } else {
        existing.parts.push({ quantity: qty, unit });
      }
    } else {
      byName.set(key, { parts: [{ quantity: qty, unit }], rawName: desc });
    }
  }

  const items: ShoppingItem[] = [];

  for (const { parts, rawName } of byName.values()) {
    const labels = parts
      .map(({ quantity, unit }) => {
        const qtyStr = formatQuantity(quantity);
        const unitStr = unit ? ` ${unit}` : '';
        return qtyStr ? `${qtyStr}${unitStr}` : '';
      })
      .filter(Boolean);

    items.push({
      id: crypto.randomUUID(),
      name: rawName,
      quantity: labels.join(' + '),
      category: guessCategory(rawName),
      checked: false,
    });
  }

  return sortItems(items);
}

interface AiMergedItem {
  name: string;
  quantity: string;
  category: Category;
}

/**
 * AI-enhanced ingredient merge. Uses parse-ingredient for initial parsing,
 * then sends the pre-parsed list to Claude Haiku for smart normalization,
 * merging of similar items, and accurate categorization.
 */
export async function mergeIngredientsWithAI(
  ingredientLists: string[][],
  apiKey: string,
): Promise<ShoppingItem[]> {
  // Step 1: Parse with library
  const allRaw = ingredientLists.flat().map(cleanRawText).filter(Boolean);
  const parsed = parseIngredient(allRaw.join('\n'), { normalizeUOM: true });

  // Build structured data for the AI
  const ingredientData = parsed
    .filter((item) => !item.isGroupHeader)
    .map((item) => ({
      qty: item.quantity2 ?? item.quantity ?? 0,
      unit: item.unitOfMeasureID ?? '',
      name: item.description,
    }));

  if (ingredientData.length === 0) return [];

  // Step 2: Ask AI to normalize, merge, and categorize
  const prompt = `You are a shopping list assistant. Below is a JSON array of recipe ingredients parsed from multiple recipes.

## Parsed Ingredients
${JSON.stringify(ingredientData)}

## Your Job
1. Merge duplicates: Combine items that are the same ingredient. Be smart — "large eggs" and "eggs" are the same; "Greek yogurt" and "plain yogurt" are different; "salt and pepper", "salt and freshly ground pepper", "salt" should all merge into one "salt and pepper" entry.
2. Add up quantities when units match. If units differ for the same item, show both (e.g., "1 cup + 2 tbsp").
3. Clean up names: Remove prep instructions (diced, minced, chopped), footnote markers (*, **), price annotations ($3). Keep names clean and readable.
4. Categorize each item into exactly one of: produce, meat, dairy, bakery, frozen, pantry.

## Response Format
Respond with ONLY a JSON array (no markdown fences, no extra text):
[{"name":"butter","quantity":"3 tbsp","category":"dairy"}]

Rules for the quantity field:
- Use simple formats: "2 cups", "1/2 lb", "3", "1 cup + 2 tbsp"
- Use fractions not decimals: "1/2" not "0.5"
- If no quantity, use ""
- NEVER put the ingredient name or notes in the quantity field`;

  const response = await fetch('/api/ai/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    // Fall back to library-only merge on API failure
    console.warn('AI merge failed, falling back to library merge');
    return mergeIngredients(ingredientLists);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;

  if (!text) {
    return mergeIngredients(ingredientLists);
  }

  try {
    let jsonStr = text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const aiItems: AiMergedItem[] = JSON.parse(jsonStr);

    if (!Array.isArray(aiItems)) {
      return mergeIngredients(ingredientLists);
    }

    const validCategories = new Set(CATEGORY_ORDER);
    const items: ShoppingItem[] = aiItems.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity || '',
      category: validCategories.has(item.category as Category) ? (item.category as Category) : guessCategory(item.name),
      checked: false,
    }));

    return sortItems(items);
  } catch {
    // JSON parse failed — fall back to library-only merge
    return mergeIngredients(ingredientLists);
  }
}
