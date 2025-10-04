import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider implements LLMProviderInterface {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  private formatMessages(messages: ChatMessage[]): {
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    return {
      system: systemMessage?.content,
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    };
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
        const formatted = this.formatMessages(messages);

        const stream = await this.client.messages.stream({
          model: config.model,
          max_tokens: config.maxTokens ?? 4096,
          temperature: config.temperature ?? 0.7,
          top_p: config.topP ?? 1,
          system: formatted.system,
          messages: formatted.messages,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            onChunk({
              delta: chunk.delta.text,
              isComplete: false,
            });
          }

          if (chunk.type === 'message_stop') {
            onChunk({
              delta: '',
              isComplete: true,
            });
          }
        }

        const finalMessage = await stream.finalMessage();

        const usage: TokenUsage = {
          promptTokens: finalMessage.usage.input_tokens,
          completionTokens: finalMessage.usage.output_tokens,
          totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
        };

        onComplete(usage);
      });
    } catch (error: any) {
      onError(error);
    }
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<LLMResponse> {
    return withRetry(async () => {
      const formatted = this.formatMessages(messages);

      const response = await this.client.messages.create({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        temperature: config.temperature ?? 0.7,
        top_p: config.topP ?? 1,
        system: formatted.system,
        messages: formatted.messages,
      });

      const usage: TokenUsage = {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      };

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

      return {
        content,
        usage,
        model: response.model,
        finishReason: response.stop_reason || undefined,
      };
    });
  }

  estimateTokens(messages: ChatMessage[]): number {
    return estimateMessagesTokens(messages);
  }
}
