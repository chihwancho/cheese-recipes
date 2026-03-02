export type TabId = 'weekly-plan' | 'recipes' | 'shopping-list' | 'favorites';

export interface Meal {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: string;
  calories: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
  images: string[];
  rating: number;
  notes: string;
  isFavorite: boolean;
  source: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery';
  checked: boolean;
}

export type LlmProvider = 'anthropic' | 'openai';

export interface UserSettings {
  llmProvider: LlmProvider;
  apiKey: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DayPlan {
  day: string;
  date: string;
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snack: Meal[];
}
