// Hardcoded pricing per 1M tokens -- updated when models change
export interface ModelPricing {
  input: number;   // $ per 1M input tokens
  output: number;  // $ per 1M output tokens
  cacheRead?: number;  // $ per 1M cache read tokens (if different from input * 0.1)
  cacheWrite?: number; // $ per 1M cache creation tokens (if different from input * 1.25)
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude models
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
  'claude-haiku-3.5-20241022': { input: 0.80, output: 4.0 },
  // Fallback for unknown Claude models
  'claude-default': { input: 3.0, output: 15.0 },
  // Codex models
  'codex-default': { input: 3.0, output: 15.0 },
  // Gemini models
  'gemini-default': { input: 1.25, output: 5.0 },
};

export interface TurnUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export function calculateTurnCost(usage: TurnUsage, model: string): number {
  // Find best matching pricing entry
  const pricing = MODEL_PRICING[model]
    || MODEL_PRICING[Object.keys(MODEL_PRICING).find(k => model.startsWith(k.replace(/-\d+$/, ''))) || '']
    || MODEL_PRICING['claude-default'];

  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  const cacheReadCost = (usage.cacheReadTokens / 1_000_000) * (pricing.cacheRead ?? pricing.input * 0.1);
  const cacheWriteCost = (usage.cacheCreationTokens / 1_000_000) * (pricing.cacheWrite ?? pricing.input * 1.25);
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
