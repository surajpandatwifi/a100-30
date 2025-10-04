import { ModelName, ModelPricing, TokenUsage, CostEstimate } from '../../types/llm';

export const MODEL_PRICING: Record<ModelName, ModelPricing> = {
  'gpt-4': {
    promptCostPer1k: 0.03,
    completionCostPer1k: 0.06,
  },
  'gpt-4-turbo': {
    promptCostPer1k: 0.01,
    completionCostPer1k: 0.03,
  },
  'gpt-4o': {
    promptCostPer1k: 0.0025,
    completionCostPer1k: 0.01,
  },
  'gpt-3.5-turbo': {
    promptCostPer1k: 0.0005,
    completionCostPer1k: 0.0015,
  },
  'claude-3-5-sonnet-20241022': {
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.015,
  },
  'claude-3-opus-20240229': {
    promptCostPer1k: 0.015,
    completionCostPer1k: 0.075,
  },
  'claude-3-sonnet-20240229': {
    promptCostPer1k: 0.003,
    completionCostPer1k: 0.015,
  },
  'gemini-2.0-flash-exp': {
    promptCostPer1k: 0.0,
    completionCostPer1k: 0.0,
  },
  'gemini-1.5-pro': {
    promptCostPer1k: 0.00125,
    completionCostPer1k: 0.005,
  },
  'gemini-1.5-flash': {
    promptCostPer1k: 0.000075,
    completionCostPer1k: 0.0003,
  },
};

export function calculateCost(model: ModelName, usage: TokenUsage): CostEstimate {
  const pricing = MODEL_PRICING[model];

  const promptCost = (usage.promptTokens / 1000) * pricing.promptCostPer1k;
  const completionCost = (usage.completionTokens / 1000) * pricing.completionCostPer1k;

  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
    tokens: usage,
  };
}

export function estimateCost(model: ModelName, estimatedPromptTokens: number, estimatedCompletionTokens: number): CostEstimate {
  const usage: TokenUsage = {
    promptTokens: estimatedPromptTokens,
    completionTokens: estimatedCompletionTokens,
    totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
  };

  return calculateCost(model, usage);
}
