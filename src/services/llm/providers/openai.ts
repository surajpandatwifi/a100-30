import OpenAI from 'openai';
import {
  ChatMessage,
  LLMProviderInterface,
  LLMResponse,
  ModelConfig,
  StreamChunk,
  TokenUsage,
} from '../../../types/llm';
import { withRetry } from '../retry';
import { estimateMessagesTokens } from '../tokenizer';

export class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async streamChat(
    messages: ChatMessage[],
    config: ModelConfig,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: (usage: TokenUsage) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      await withRetry(async () => {
        const stream = await this.client.chat.completions.create({
          model: config.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 4096,
          top_p: config.topP ?? 1,
          stream: true,
        });

        let completionTokens = 0;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';

          if (delta) {
            completionTokens += Math.ceil(delta.length / 4);
            onChunk({
              delta,
              isComplete: false,
            });
          }

          if (chunk.choices[0]?.finish_reason) {
            onChunk({
              delta: '',
              isComplete: true,
            });

            const usage: TokenUsage = {
              promptTokens: this.estimateTokens(messages),
              completionTokens,
              totalTokens: this.estimateTokens(messages) + completionTokens,
            };

            onComplete(usage);
          }
        }
      });
    } catch (error: any) {
      onError(error);
    }
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<LLMResponse> {
    return withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4096,
        top_p: config.topP ?? 1,
      });

      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      };

      return {
        content: response.choices[0]?.message?.content || '',
        usage,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason || undefined,
      };
    });
  }

  estimateTokens(messages: ChatMessage[]): number {
    return estimateMessagesTokens(messages);
  }
}
