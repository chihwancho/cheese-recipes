import type { Recipe, DayPlan, MealSlot } from '../../types';

export interface MealSlotSelection {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snack: boolean;
}

export interface MealPlanConstraints {
  days: number;
  slots: MealSlotSelection;
  dietaryNotes: string;
}

export interface AiMealAssignment {
  slot: MealSlot;
  recipeTitles: string[];
}

export interface AiDayPlan {
  dayIndex: number;
  meals: AiMealAssignment[];
}

export interface AiMealPlanResponse {
  days: AiDayPlan[];
}

export interface AiProvider {
  generateMealPlan(
    recipes: Recipe[],
    constraints: MealPlanConstraints,
    currentWeek: DayPlan[],
  ): Promise<AiMealPlanResponse>;
}
