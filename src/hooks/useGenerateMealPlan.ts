import { useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useRecipes } from '../context/RecipeContext';
import { useMealPlan } from '../context/MealPlanContext';
import { createAiProvider } from '../services/ai';
import type { MealPlanConstraints } from '../services/ai/types';
import type { Meal, MealSlot } from '../types';

let nextId = 9000;

export function useGenerateMealPlan() {
  const { settings, hasApiKey } = useSettings();
  const { recipes } = useRecipes();
  const { weekPlan, setWeekPlan } = useMealPlan();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (constraints: MealPlanConstraints, clearExisting: boolean) => {
    if (!hasApiKey) {
      setError('Please set your API key in Settings first.');
      return false;
    }
    if (recipes.length === 0) {
      setError('Add some recipes first so the AI can build a plan.');
      return false;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const provider = createAiProvider(settings.llmProvider, settings.apiKey);
      const result = await provider.generateMealPlan(recipes, constraints, weekPlan);

      setWeekPlan((prev) => {
        const next = prev.map((day) => ({
          ...day,
          breakfast: clearExisting ? [] : [...day.breakfast],
          lunch: clearExisting ? [] : [...day.lunch],
          dinner: clearExisting ? [] : [...day.dinner],
          snack: clearExisting ? [] : [...day.snack],
        }));

        for (const aiDay of result.days) {
          if (aiDay.dayIndex < 0 || aiDay.dayIndex >= next.length) continue;
          for (const assignment of aiDay.meals) {
            const slot: MealSlot = assignment.slot;
            for (const title of assignment.recipeTitles) {
              const recipe = recipes.find(
                (r) => r.title.toLowerCase() === title.toLowerCase()
              );
              if (!recipe) continue;

              const meal: Meal = {
                id: `ai-${recipe.id}-${nextId++}`,
                name: recipe.title,
                category: slot,
                prepTime: recipe.prepTime,
                calories: Math.round(
                  recipe.tags.includes('Healthy') ? 350 :
                  recipe.tags.includes('Sweet') ? 450 : 500
                ),
              };
              next[aiDay.dayIndex][slot].push(meal);
            }
          }
        }
        return next;
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [hasApiKey, recipes, settings, weekPlan, setWeekPlan]);

  return { generate, isGenerating, error, clearError: () => setError(null) };
}
