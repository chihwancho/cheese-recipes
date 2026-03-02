import { useEffect, useRef } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import {
  buildRecipeEmbeddingText,
  generateEmbeddings,
  upsertRecipeEmbedding,
  fetchEmbeddingTexts,
} from '../services/embeddings';

const BATCH_SIZE = 50;

export function useEmbeddingSync() {
  const { user } = useAuth();
  const { recipes } = useRecipes();
  const { settings } = useSettings();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || !settings.embeddingApiKey || recipes.length === 0 || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const existingTexts = await fetchEmbeddingTexts(user.id);
        if (!existingTexts) return;

        const needsEmbedding = recipes.filter((r) => {
          const currentText = buildRecipeEmbeddingText(r);
          const storedText = existingTexts.get(r.id);
          return storedText === undefined || storedText !== currentText;
        });

        if (needsEmbedding.length === 0) return;

        console.log(`Embedding sync: ${needsEmbedding.length} recipes need embedding`);

        for (let i = 0; i < needsEmbedding.length; i += BATCH_SIZE) {
          const batch = needsEmbedding.slice(i, i + BATCH_SIZE);
          const texts = batch.map(buildRecipeEmbeddingText);

          const embeddings = await generateEmbeddings(settings.embeddingApiKey, texts);

          await Promise.all(
            batch.map((recipe, idx) =>
              upsertRecipeEmbedding(user.id, recipe.id, embeddings[idx], texts[idx]),
            ),
          );
        }

        console.log('Embedding sync complete');
      } catch (err) {
        console.warn('Embedding sync failed (non-blocking):', err);
      }
    })();
  }, [user, recipes, settings.embeddingApiKey]);
}
