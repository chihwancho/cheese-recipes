import type { Recipe } from '../types';

const EXTRACT_PROMPT = `Extract the recipe from the provided content and return a JSON object with this exact structure:
{"title":"Recipe Name","description":"Brief description","prepTime":"15 min","cookTime":"30 min","servings":4,"ingredients":["1 cup flour","2 eggs"],"steps":["Step 1 text","Step 2 text"],"tags":["tag1","tag2"]}

Rules:
- servings must be a number (default 4 if unknown)
- prepTime/cookTime: human-readable like "15 min" or "1 hr 30 min"
- ingredients: each as a single string e.g. "2 cups flour, sifted"
- steps: plain text instructions, no step numbers
- tags: cuisine or meal type keywords, lowercase
- Respond with ONLY the JSON object, no markdown fences, no explanation`;

interface AiRecipeResponse {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
}

async function callAI(
  messages: object[],
  apiKey: string,
): Promise<Partial<Recipe>> {
  const response = await fetch('/api/ai/anthropic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model: 'claude-sonnet-4-6',
      maxTokens: 4096,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from AI');

  let jsonStr = text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const parsed: AiRecipeResponse = JSON.parse(jsonStr);
  return {
    title: parsed.title || '',
    description: parsed.description || '',
    prepTime: parsed.prepTime || '',
    cookTime: parsed.cookTime || '',
    servings: typeof parsed.servings === 'number' ? parsed.servings : 4,
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.filter(Boolean) : [],
    steps: Array.isArray(parsed.steps) ? parsed.steps.filter(Boolean) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean) : [],
    images: [],
  };
}

export async function parseRecipeFromText(
  text: string,
  apiKey: string,
): Promise<Partial<Recipe>> {
  return callAI(
    [{ role: 'user', content: `${EXTRACT_PROMPT}\n\n---\n${text}` }],
    apiKey,
  );
}

export async function parseRecipeFromImage(
  base64: string,
  mimeType: string,
  apiKey: string,
): Promise<Partial<Recipe>> {
  return callAI(
    [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      },
    ],
    apiKey,
  );
}

export async function parseRecipeFromPdf(
  base64: string,
  apiKey: string,
): Promise<Partial<Recipe>> {
  return callAI(
    [
      {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: EXTRACT_PROMPT },
        ],
      },
    ],
    apiKey,
  );
}

/** Read a File as a base64 string (without the data: prefix) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:...;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
