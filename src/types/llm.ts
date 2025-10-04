export type LLMProvider = 'openai' | 'anthropic' | 'google';

export type ModelName =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

export interface ModelConfig {
  provider: LLMProvider;
  model: ModelName;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  delta: string;
  isComplete: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
}

export interface ModelPricing {
  promptCostPer1k: number;
  completionCostPer1k: number;
}

export interface CostEstimate {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  tokens: TokenUsage;
}

export interface LLMProviderInterface {
  streamChat(
    messages: ChatMessage[],
    config: ModelConfig,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: (usage: TokenUsage) => void,
    onError: (error: Error) => void
  ): Promise<void>;

  chat(
    messages: ChatMessage[],
    config: ModelConfig
  ): Promise<LLMResponse>;

  estimateTokens(messages: ChatMessage[]): number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}
