import { useState, useCallback } from 'react';
import type { DayPlan, MealSlot, Recipe } from '../types';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function buildPrompt(weekPlan: DayPlan[], recipes: Recipe[]): string {
  const recipeMap = new Map(recipes.map((r) => [r.title, r]));

  const weekSummary = weekPlan
    .map((day) => {
      const meals = SLOTS.flatMap((slot) =>
        day[slot].map((meal) => {
          const recipe = recipeMap.get(meal.name);
          const ingredients = recipe ? recipe.ingredients.join(', ') : 'unknown';
          return `  ${slot}: "${meal.name}" (ingredients: ${ingredients})`;
        }),
      );
      if (meals.length === 0) return null;
      return `${day.day} (${day.date}):\n${meals.join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `You are a friendly nutrition observer. Review the following weekly meal plan and provide general observations about nutritional balance and variety.

## This Week's Meal Plan
${weekSummary}

## Instructions
- Analyze the overall balance of food groups: proteins, vegetables, grains, dairy, and fruits.
- Note any patterns in variety or repetition.
- Identify potential nutritional gaps (e.g., low vegetable intake, limited protein sources).
- Provide 3-5 concise, friendly observations as bullet points.
- Keep the tone encouraging and observational — NOT prescriptive.
- Do NOT provide specific calorie counts, macro breakdowns, or medical advice.
- Start each bullet with a short bolded label like **Protein variety:** or **Vegetables:**.

Respond with ONLY the bullet points, no introduction or conclusion.`;
}

export function useNutritionReview() {
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReview = useCallback(
    async (apiKey: string, weekPlan: DayPlan[], recipes: Recipe[]) => {
      setIsLoading(true);
      setError('');
      setReview('');

      try {
        const prompt = buildPrompt(weekPlan, recipes);

        const response = await fetch('/api/ai/anthropic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            model: 'claude-haiku-4-5-20251001',
            maxTokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text;

        if (!text) {
          throw new Error('Empty response from AI');
        }

        setReview(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate review');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { review, isLoading, error, generateReview };
}
