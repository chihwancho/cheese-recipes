import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Recipe } from '../types';
import { loadUserData, saveUserData } from '../utils/userStorage';
import { fetchRecipes, upsertRecipe, deleteRecipe as deleteRecipeCloud } from '../services/data/supabaseData';

interface RecipeContextValue {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateRating: (id: string, rating: number) => void;
  updateNotes: (id: string, notes: string) => void;
}

const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    loadUserData<Recipe[]>(userId, 'recipes') ?? []
  );

  // Load from localStorage on userId change
  useEffect(() => {
    setRecipes(loadUserData<Recipe[]>(userId, 'recipes') ?? []);
  }, [userId]);

  // Fetch from Supabase on mount / userId change, update local cache
  useEffect(() => {
    fetchRecipes(userId).then((cloud) => {
      if (cloud !== null) {
        setRecipes(cloud);
        saveUserData(userId, 'recipes', cloud);
      }
    });
  }, [userId]);

  // Helper: persist to localStorage after state update
  const saveLocal = useCallback((updater: (prev: Recipe[]) => Recipe[]) => {
    setRecipes((prev) => {
      const next = updater(prev);
      saveUserData(userId, 'recipes', next);
      return next;
    });
  }, [userId]);

  const addRecipe = useCallback((recipe: Recipe) => {
    saveLocal((prev) => [...prev, recipe]);
    upsertRecipe(userId, recipe);
  }, [userId, saveLocal]);

  const updateRecipe = useCallback((id: string, updates: Partial<Recipe>) => {
    saveLocal((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      const recipe = updated.find((r) => r.id === id);
      if (recipe) upsertRecipe(userId, recipe);
      return updated;
    });
  }, [userId, saveLocal]);

  const deleteRecipe = useCallback((id: string) => {
    saveLocal((prev) => prev.filter((r) => r.id !== id));
    deleteRecipeCloud(userId, id);
  }, [userId, saveLocal]);

  const toggleFavorite = useCallback((id: string) => {
    saveLocal((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
      const recipe = updated.find((r) => r.id === id);
      if (recipe) upsertRecipe(userId, recipe);
      return updated;
    });
  }, [userId, saveLocal]);

  const updateRating = useCallback((id: string, rating: number) => {
    saveLocal((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, rating } : r));
      const recipe = updated.find((r) => r.id === id);
      if (recipe) upsertRecipe(userId, recipe);
      return updated;
    });
  }, [userId, saveLocal]);

  const updateNotes = useCallback((id: string, notes: string) => {
    saveLocal((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, notes } : r));
      const recipe = updated.find((r) => r.id === id);
      if (recipe) upsertRecipe(userId, recipe);
      return updated;
    });
  }, [userId, saveLocal]);

  const value = useMemo(() => ({
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    updateRating,
    updateNotes,
  }), [recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite, updateRating, updateNotes]);

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used within RecipeProvider');
  return ctx;
}
