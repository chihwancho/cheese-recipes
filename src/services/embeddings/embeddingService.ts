import { supabase } from '../../lib/supabase';
import type { Recipe } from '../../types';

/**
 * Compose searchable text from a recipe's key fields.
 */
export function buildRecipeEmbeddingText(recipe: Recipe): string {
  const parts = [
    recipe.title,
    recipe.description,
    recipe.tags.length > 0 ? `Tags: ${recipe.tags.join(', ')}` : '',
    recipe.ingredients.length > 0 ? `Ingredients: ${recipe.ingredients.join(', ')}` : '',
  ];
  return parts.filter(Boolean).join('\n');
}

/**
 * Compose a query string from meal plan generation constraints.
 */
export function buildQueryText(
  slots: string[],
  dietaryNotes: string,
  dayContext: string,
): string {
  const parts = [
    `Meal planning for: ${slots.join(', ')}`,
    dietaryNotes ? `Preferences: ${dietaryNotes}` : '',
    dayContext ? `Days: ${dayContext}` : '',
  ];
  return parts.filter(Boolean).join('\n');
}

/**
 * Call the embeddings proxy to generate embeddings via OpenAI.
 * `input` can be a single string or an array of strings (batch).
 */
export async function generateEmbeddings(
  apiKey: string,
  input: string | string[],
): Promise<number[][]> {
  const response = await fetch('/api/ai/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, input }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  // OpenAI returns { data: [{ embedding: number[] }, ...] }
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * Convenience wrapper for embedding a single query string.
 */
export async function generateQueryEmbedding(
  apiKey: string,
  query: string,
): Promise<number[]> {
  const [embedding] = await generateEmbeddings(apiKey, query);
  return embedding;
}

/**
 * Store or update a recipe's embedding in Supabase.
 */
export async function upsertRecipeEmbedding(
  userId: string,
  recipeId: string,
  embedding: number[],
  embeddingText: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('recipe_embeddings')
    .upsert(
      {
        recipe_id: recipeId,
        user_id: userId,
        embedding: JSON.stringify(embedding),
        embedding_text: embeddingText,
      },
      { onConflict: 'recipe_id' },
    );
  if (error) {
    console.error('Failed to upsert recipe embedding:', error.message);
    return false;
  }
  return true;
}

/**
 * Delete a recipe's embedding when the recipe is deleted.
 */
export async function deleteRecipeEmbedding(
  userId: string,
  recipeId: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('recipe_embeddings')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to delete recipe embedding:', error.message);
    return false;
  }
  return true;
}

/**
 * Fetch existing embedding texts for staleness detection.
 * Returns a Map of recipeId → embeddingText.
 */
export async function fetchEmbeddingTexts(
  userId: string,
): Promise<Map<string, string> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('recipe_embeddings')
    .select('recipe_id, embedding_text')
    .eq('user_id', userId);
  if (error) {
    console.error('Failed to fetch embedding texts:', error.message);
    return null;
  }
  const map = new Map<string, string>();
  for (const row of data as { recipe_id: string; embedding_text: string }[]) {
    map.set(row.recipe_id, row.embedding_text);
  }
  return map;
}

/**
 * Search for similar recipes using the match_recipes RPC function.
 * Returns recipe IDs sorted by similarity (most similar first).
 */
export async function searchSimilarRecipes(
  userId: string,
  queryEmbedding: number[],
  count: number = 30,
  threshold: number = 0.3,
): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('match_recipes', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_user_id: userId,
    match_count: count,
    match_threshold: threshold,
  });
  if (error) {
    console.error('Failed to search similar recipes:', error.message);
    return [];
  }
  return (data as { recipe_id: string; similarity: number }[]).map((r) => r.recipe_id);
}
