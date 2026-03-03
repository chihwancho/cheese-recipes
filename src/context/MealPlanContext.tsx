import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DayPlan, Meal, MealSlot, Recipe } from '../types';
import { createEmptyWeek, getMonday } from '../data/sampleData';
import { loadUserData, saveUserData } from '../utils/userStorage';
import { fetchAllMealPlans, upsertMealPlan } from '../services/data/supabaseData';

function weekKey(monday: Date): string {
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let nextMealId = 5000;

interface MealPlanContextValue {
  allWeeks: Record<string, DayPlan[]>;
  currentMonday: Date;
  weekPlan: DayPlan[];
  setWeekPlan: (updater: (prev: DayPlan[]) => DayPlan[]) => void;
  setCurrentMonday: (date: Date) => void;
  getRecipeUsageCount: (recipeName: string) => number;
  getRecipeUsageDates: (recipeName: string) => string[];
  addMealToPlan: (recipe: Recipe, dayIndex: number, slot: MealSlot) => void;
}

const MealPlanContext = createContext<MealPlanContextValue | null>(null);

function defaultAllWeeks(): Record<string, DayPlan[]> {
  const monday = getMonday(new Date());
  return { [weekKey(monday)]: createEmptyWeek(monday) };
}

export function MealPlanProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [allWeeks, setAllWeeks] = useState<Record<string, DayPlan[]>>(() =>
    loadUserData<Record<string, DayPlan[]>>(userId, 'mealPlan') ?? defaultAllWeeks()
  );
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const isInitialMount = useRef(true);
  const isSyncingFromCloud = useRef(false);

  // Load from localStorage on userId change
  useEffect(() => {
    setAllWeeks(loadUserData<Record<string, DayPlan[]>>(userId, 'mealPlan') ?? defaultAllWeeks());
  }, [userId]);

  // Fetch from Supabase on mount / userId change
  useEffect(() => {
    fetchAllMealPlans(userId).then((cloud) => {
      if (cloud !== null) {
        isSyncingFromCloud.current = true;
        const data = Object.keys(cloud).length > 0 ? cloud : defaultAllWeeks();
        setAllWeeks(data);
        saveUserData(userId, 'mealPlan', data);
      }
    });
  }, [userId]);

  // Track the previous allWeeks to detect which weeks actually changed
  const prevWeeksRef = useRef(allWeeks);

  // Save to localStorage + Supabase on changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevWeeksRef.current = allWeeks;
      return;
    }
    if (isSyncingFromCloud.current) {
      isSyncingFromCloud.current = false;
      prevWeeksRef.current = allWeeks;
      return;
    }
    saveUserData(userId, 'mealPlan', allWeeks);
    // Only sync weeks that actually changed
    const prev = prevWeeksRef.current;
    for (const [wk, days] of Object.entries(allWeeks)) {
      if (prev[wk] !== days) {
        upsertMealPlan(userId, wk, days);
      }
    }
    prevWeeksRef.current = allWeeks;
  }, [userId, allWeeks]);

  const key = weekKey(currentMonday);

  const weekPlan = useMemo(() => {
    return allWeeks[key] ?? createEmptyWeek(currentMonday);
  }, [allWeeks, key, currentMonday]);

  const setWeekPlan = useCallback((updater: (prev: DayPlan[]) => DayPlan[]) => {
    setAllWeeks((prev) => {
      const current = prev[key] ?? createEmptyWeek(currentMonday);
      return { ...prev, [key]: updater(current) };
    });
  }, [key, currentMonday]);

  const getRecipeUsageDates = useCallback((recipeName: string): string[] => {
    const dates: string[] = [];
    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (const week of Object.values(allWeeks)) {
      for (const day of week) {
        for (const slot of slots) {
          for (const meal of day[slot]) {
            if (meal.name === recipeName) {
              dates.push(day.date);
            }
          }
        }
      }
    }
    return dates.sort();
  }, [allWeeks]);

  const getRecipeUsageCount = useCallback((recipeName: string): number => {
    return getRecipeUsageDates(recipeName).length;
  }, [getRecipeUsageDates]);

  const addMealToPlan = useCallback((recipe: Recipe, dayIndex: number, slot: MealSlot) => {
    const meal: Meal = {
      id: `recipe-${recipe.id}-${nextMealId++}`,
      name: recipe.title,
      category: slot,
      prepTime: recipe.prepTime,
      calories: Math.round(
        recipe.tags.includes('Healthy') ? 350 :
        recipe.tags.includes('Sweet') ? 450 :
        500
      ),
    };

    setWeekPlan((prev) => {
      const next = prev.map((day) => ({
        ...day,
        breakfast: [...day.breakfast],
        lunch: [...day.lunch],
        dinner: [...day.dinner],
        snack: [...day.snack],
      }));
      next[dayIndex][slot].push(meal);
      return next;
    });
  }, [setWeekPlan]);

  const value = useMemo(() => ({
    allWeeks,
    currentMonday,
    weekPlan,
    setWeekPlan,
    setCurrentMonday,
    getRecipeUsageCount,
    getRecipeUsageDates,
    addMealToPlan,
  }), [allWeeks, currentMonday, weekPlan, setWeekPlan, getRecipeUsageCount, getRecipeUsageDates, addMealToPlan]);

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan must be used within MealPlanProvider');
  return ctx;
}
