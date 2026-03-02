import { supabase } from '../../lib/supabase';
import type { Recipe, ShoppingItem, DayPlan, UserSettings } from '../../types';
import { encrypt, decrypt } from '../../utils/crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function ensureUUID(id: string): string {
  return UUID_REGEX.test(id) ? id : crypto.randomUUID();
}

// ============================================================
// Helpers: camelCase <-> snake_case mapping
// ============================================================

interface RecipeRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
  images: string[];
  rating: number;
  notes: string;
  is_favorite: boolean;
  source: string;
}

interface ShoppingItemRow {
  id: string;
  user_id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

interface MealPlanRow {
  id: string;
  user_id: string;
  week_key: string;
  days: DayPlan[];
}

interface UserSettingsRow {
  id: string;
  user_id: string;
  llm_provider: string;
  encrypted_api_key: string;
}

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    ingredients: row.ingredients,
    steps: row.steps,
    tags: row.tags,
    images: row.images,
    rating: row.rating,
    notes: row.notes,
    isFavorite: row.is_favorite,
    source: row.source,
  };
}

function recipeToRow(userId: string, recipe: Recipe): Omit<RecipeRow, 'id'> & { id?: string } {
  return {
    id: ensureUUID(recipe.id),
    user_id: userId,
    title: recipe.title,
    description: recipe.description,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    tags: recipe.tags,
    images: recipe.images,
    rating: recipe.rating,
    notes: recipe.notes,
    is_favorite: recipe.isFavorite,
    source: recipe.source,
  };
}

function rowToShoppingItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category as ShoppingItem['category'],
    checked: row.checked,
  };
}

function shoppingItemToRow(userId: string, item: ShoppingItem): Omit<ShoppingItemRow, 'id'> & { id?: string } {
  return {
    id: ensureUUID(item.id),
    user_id: userId,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    checked: item.checked,
  };
}

// ============================================================
// Recipes
// ============================================================

export async function fetchRecipes(userId: string): Promise<Recipe[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Failed to fetch recipes:', error.message);
    return null;
  }
  return (data as RecipeRow[]).map(rowToRecipe);
}

export async function upsertRecipe(userId: string, recipe: Recipe): Promise<boolean> {
  if (!supabase) return false;
  const row = recipeToRow(userId, recipe);
  const { error } = await supabase.from('recipes').upsert(row);
  if (error) {
    console.error('Failed to upsert recipe:', error.message);
    return false;
  }
  return true;
}

export async function deleteRecipe(userId: string, recipeId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to delete recipe:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// Shopping Items
// ============================================================

export async function fetchShoppingItems(userId: string): Promise<ShoppingItem[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Failed to fetch shopping items:', error.message);
    return null;
  }
  return (data as ShoppingItemRow[]).map(rowToShoppingItem);
}

export async function upsertShoppingItem(userId: string, item: ShoppingItem): Promise<boolean> {
  if (!supabase) return false;
  const row = shoppingItemToRow(userId, item);
  const { error } = await supabase.from('shopping_items').upsert(row);
  if (error) {
    console.error('Failed to upsert shopping item:', error.message);
    return false;
  }
  return true;
}

export async function upsertShoppingItems(userId: string, items: ShoppingItem[]): Promise<boolean> {
  if (!supabase || items.length === 0) return true;
  const rows = items.map((i) => shoppingItemToRow(userId, i));
  const { error } = await supabase.from('shopping_items').upsert(rows);
  if (error) {
    console.error('Failed to upsert shopping items:', error.message);
    return false;
  }
  return true;
}

export async function deleteShoppingItem(userId: string, itemId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to delete shopping item:', error.message);
    return false;
  }
  return true;
}

export async function deleteShoppingItems(userId: string, itemIds: string[]): Promise<boolean> {
  if (!supabase || itemIds.length === 0) return true;
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .in('id', itemIds)
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to delete shopping items:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// Meal Plans
// ============================================================

export async function fetchAllMealPlans(userId: string): Promise<Record<string, DayPlan[]> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to fetch meal plans:', error.message);
    return null;
  }
  const result: Record<string, DayPlan[]> = {};
  for (const row of data as MealPlanRow[]) {
    result[row.week_key] = row.days;
  }
  return result;
}

export async function upsertMealPlan(userId: string, weekKey: string, days: DayPlan[]): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('meal_plans')
    .upsert(
      { user_id: userId, week_key: weekKey, days },
      { onConflict: 'user_id,week_key' }
    );
  if (error) {
    console.error('Failed to upsert meal plan:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// User Settings
// ============================================================

export async function fetchSettings(userId: string, password: string): Promise<UserSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) {
    // PGRST116 = no rows found, not a real error
    if (error.code === 'PGRST116') return null;
    console.error('Failed to fetch settings:', error.message);
    return null;
  }
  const row = data as UserSettingsRow;
  let apiKey = '';
  if (row.encrypted_api_key) {
    apiKey = (await decrypt(row.encrypted_api_key, password)) ?? '';
  }
  return {
    llmProvider: row.llm_provider as UserSettings['llmProvider'],
    apiKey,
  };
}

export async function upsertSettings(userId: string, settings: UserSettings, password: string): Promise<boolean> {
  if (!supabase) return false;
  const encryptedApiKey = settings.apiKey
    ? await encrypt(settings.apiKey, password)
    : '';
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        llm_provider: settings.llmProvider,
        encrypted_api_key: encryptedApiKey,
      },
      { onConflict: 'user_id' }
    );
  if (error) {
    console.error('Failed to upsert settings:', error.message);
    return false;
  }
  return true;
}
