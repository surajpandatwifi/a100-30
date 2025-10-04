import {
  ChatMessage,
  LLMProvider,
  LLMProviderInterface,
  LLMResponse,
  ModelConfig,
  StreamChunk,
  TokenUsage,
} from '../../types/llm';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';

export class LLMService {
  private providers: Map<LLMProvider, LLMProviderInterface> = new Map();

  constructor(apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  }) {
    if (apiKeys.openai) {
      this.providers.set('openai', new OpenAIProvider(apiKeys.openai));
    }

    if (apiKeys.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider(apiKeys.anthropic));
    }

    if (apiKeys.google) {
      this.providers.set('google', new GoogleProvider(apiKeys.google));
    }
  }

  private getProvider(provider: LLMProvider): LLMProviderInterface {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(
        `Provider ${provider} not initialized. Please provide an API key for this provider.`
      );
    }
    return providerInstance;
  }

  async streamChat(
    messages: ChatMessage[],
    config: ModelConfig,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: (usage: TokenUsage) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const provider = this.getProvider(config.provider);
    return provider.streamChat(messages, config, onChunk, onComplete, onError);
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<LLMResponse> {
    const provider = this.getProvider(config.provider);
    return provider.chat(messages, config);
  }

  estimateTokens(messages: ChatMessage[], provider: LLMProvider): number {
    const providerInstance = this.getProvider(provider);
    return providerInstance.estimateTokens(messages);
  }

  isProviderAvailable(provider: LLMProvider): boolean {
    return this.providers.has(provider);
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }
}
