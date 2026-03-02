import type { AiProvider, AiMealPlanResponse, MealPlanConstraints } from './types';
import type { Recipe, DayPlan } from '../../types';

function buildPrompt(
  recipes: Recipe[],
  constraints: MealPlanConstraints,
  currentWeek: DayPlan[],
): string {
  const recipeList = recipes
    .map((r) => `- "${r.title}" (tags: ${r.tags.join(', ') || 'none'}, prep: ${r.prepTime}, servings: ${r.servings}, rating: ${r.rating}/5${r.isFavorite ? ', favorite' : ''})`)
    .join('\n');

  const enabledSlots = Object.entries(constraints.slots)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const weekInfo = currentWeek
    .slice(0, constraints.days)
    .map((d, i) => `Day ${i}: ${d.day}, ${d.date}`)
    .join('\n');

  return `You are a meal planning assistant. Generate a meal plan using ONLY recipes from the list below.

## Available Recipes
${recipeList}

## Week
${weekInfo}

## Constraints
- Fill these meal slots: ${enabledSlots.join(', ')}
- Number of days to plan: ${constraints.days}
- User preferences: ${constraints.dietaryNotes || 'None'}

## Rules
1. ONLY use recipe titles exactly as listed above. Do not invent new recipes.
2. Vary recipes across the week — avoid repeating the same recipe on consecutive days.
3. Consider recipe tags for appropriate slot placement (e.g., breakfast-tagged recipes for breakfast).
4. Prefer higher-rated and favorite recipes when possible.
5. Assign exactly one recipe per enabled slot per day.

Respond with ONLY a JSON object (no markdown fences, no explanation) matching this exact schema:
{"days":[{"dayIndex":0,"meals":[{"slot":"breakfast","recipeTitles":["Exact Recipe Title"]}]}]}`;
}

function parseAiResponse(text: string): AiMealPlanResponse {
  let jsonStr = text.trim();

  // Strip markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  if (!parsed.days || !Array.isArray(parsed.days)) {
    throw new Error('Invalid response: missing "days" array');
  }

  return parsed as AiMealPlanResponse;
}

export function createAnthropicProvider(apiKey: string): AiProvider {
  return {
    async generateMealPlan(
      recipes: Recipe[],
      constraints: MealPlanConstraints,
      currentWeek: DayPlan[],
    ): Promise<AiMealPlanResponse> {
      const prompt = buildPrompt(recipes, constraints, currentWeek);

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
        const err = await response.json().catch(() => ({}));
        const message = err?.error?.message || `API error: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from AI');
      }

      return parseAiResponse(text);
    },
  };
}
