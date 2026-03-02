import type { AiProvider } from './types';
import type { LlmProvider } from '../../types';
import { createAnthropicProvider } from './anthropicProvider';

export function createAiProvider(provider: LlmProvider, apiKey: string): AiProvider {
  switch (provider) {
    case 'anthropic':
      return createAnthropicProvider(apiKey);
    case 'openai':
      throw new Error('OpenAI provider not yet implemented');
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export type { AiProvider, MealPlanConstraints, AiMealPlanResponse } from './types';
