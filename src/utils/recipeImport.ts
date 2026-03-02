import type { Recipe } from '../types';

const FRACTION_MAP: [number, string][] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [7 / 8, '7/8'],
];

function decimalToFraction(num: number): string {
  if (Number.isInteger(num)) return String(num);

  const whole = Math.floor(num);
  const frac = num - whole;

  // Find closest common fraction (within tolerance)
  for (const [value, label] of FRACTION_MAP) {
    if (Math.abs(frac - value) < 0.03) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  // No close match — round to 2 decimal places
  return String(Math.round(num * 100) / 100);
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function cleanIngredient(text: string): string {
  // Decode HTML entities (&#39; → ', &amp; → &, etc.)
  let cleaned = decodeHtmlEntities(text);
  // Replace decimal numbers with fraction equivalents
  cleaned = cleaned.replace(/(\d*\.\d+)/g, (match) => {
    const num = parseFloat(match);
    if (isNaN(num)) return match;
    return decimalToFraction(num);
  });
  return cleaned;
}

function parseIsoDuration(iso: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return iso;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min`;
  if (hours > 0) return `${hours} hr`;
  if (minutes > 0) return `${minutes} min`;
  return '0 min';
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'text' in value) return String((value as { text: string }).text);
  return '';
}

function extractImages(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.flatMap((v) => {
      if (typeof v === 'string') return [v];
      if (v && typeof v === 'object' && 'url' in v) return [String(v.url)];
      return [];
    });
  }
  if (typeof value === 'object' && value !== null && 'url' in value) return [String((value as { url: string }).url)];
  return [];
}

function extractSteps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value.split('\n').filter(Boolean);
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object') {
        if ('text' in item) return [String(item.text)];
        if ('itemListElement' in item && Array.isArray(item.itemListElement)) {
          return item.itemListElement.map((sub: { text?: string }) => String(sub.text || ''));
        }
      }
      return [];
    }).filter(Boolean);
  }
  return [];
}

function extractKeywords(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [];
}

function extractServings(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return isNaN(num) ? 4 : num;
  }
  if (Array.isArray(value) && value.length > 0) {
    const num = parseInt(String(value[0]), 10);
    return isNaN(num) ? 4 : num;
  }
  return 4;
}

function findRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  if (obj['@type'] === 'Recipe' || (Array.isArray(obj['@type']) && (obj['@type'] as string[]).includes('Recipe'))) {
    return obj;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
  }

  if ('@graph' in obj && Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph'] as unknown[]) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
  }

  return null;
}

async function fetchHtml(url: string): Promise<string> {
  // Use Vite's dev server proxy (avoids CORS entirely)
  const proxyUrl = `/api/fetch-recipe?url=${encodeURIComponent(url)}`;
  const proxyResponse = await fetch(proxyUrl);
  if (proxyResponse.ok) {
    const data = await proxyResponse.json();
    if (data.contents) return data.contents as string;
  }

  // Fallback: try direct fetch (works if target allows CORS)
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not reach this URL. Check the link and try again.');
  }
  return await response.text();
}

export async function parseRecipeFromUrl(url: string): Promise<Partial<Recipe>> {
  const html = await fetchHtml(url);

  // Find all JSON-LD script tags
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let recipeData: Record<string, unknown> | null = null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      recipeData = findRecipeInJsonLd(parsed);
      if (recipeData) break;
    } catch {
      // Skip malformed JSON-LD
    }
  }

  if (!recipeData) {
    throw new Error('No recipe data found on this page. The site may not include structured recipe data.');
  }

  return {
    title: decodeHtmlEntities(extractText(recipeData.name) || ''),
    description: decodeHtmlEntities(extractText(recipeData.description) || ''),
    prepTime: parseIsoDuration(extractText(recipeData.prepTime)),
    cookTime: parseIsoDuration(extractText(recipeData.cookTime) || extractText(recipeData.totalTime)),
    servings: extractServings(recipeData.recipeYield),
    ingredients: Array.isArray(recipeData.recipeIngredient)
      ? recipeData.recipeIngredient.map((i) => cleanIngredient(String(i)))
      : [],
    steps: extractSteps(recipeData.recipeInstructions).map(cleanIngredient),
    tags: extractKeywords(recipeData.keywords || recipeData.recipeCategory || recipeData.recipeCuisine).map(decodeHtmlEntities),
    images: extractImages(recipeData.image),
  };
}
