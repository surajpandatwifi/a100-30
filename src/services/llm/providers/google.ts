import { GoogleGenerativeAI } from '@google/generative-ai';
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

export class GoogleProvider implements LLMProviderInterface {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private formatMessages(messages: ChatMessage[]): {
    systemInstruction?: string;
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    currentMessage: string;
  } {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const history = conversationMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    return {
      systemInstruction: systemMessage?.content,
      history,
      currentMessage: lastMessage?.content || '',
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
        const model = this.genAI.getGenerativeModel({
          model: config.model,
          systemInstruction: formatted.systemInstruction,
        });

        const chat = model.startChat({
          history: formatted.history,
          generationConfig: {
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: config.maxTokens ?? 4096,
            topP: config.topP ?? 1,
          },
        });

        const result = await chat.sendMessageStream(formatted.currentMessage);

        let completionText = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          completionText += chunkText;

          onChunk({
            delta: chunkText,
            isComplete: false,
          });
        }

        onChunk({
          delta: '',
          isComplete: true,
        });

        const response = await result.response;
        const usageMetadata = response.usageMetadata;

        const usage: TokenUsage = {
          promptTokens: usageMetadata?.promptTokenCount || this.estimateTokens(messages),
          completionTokens: usageMetadata?.candidatesTokenCount || Math.ceil(completionText.length / 4),
          totalTokens: usageMetadata?.totalTokenCount || 0,
        };

        if (!usage.totalTokens) {
          usage.totalTokens = usage.promptTokens + usage.completionTokens;
        }

        onComplete(usage);
      });
    } catch (error: any) {
      onError(error);
    }
  }

  async chat(messages: ChatMessage[], config: ModelConfig): Promise<LLMResponse> {
    return withRetry(async () => {
      const formatted = this.formatMessages(messages);
      const model = this.genAI.getGenerativeModel({
        model: config.model,
        systemInstruction: formatted.systemInstruction,
      });

      const chat = model.startChat({
        history: formatted.history,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 4096,
          topP: config.topP ?? 1,
        },
      });

      const result = await chat.sendMessage(formatted.currentMessage);
      const response = result.response;
      const usageMetadata = response.usageMetadata;

      const usage: TokenUsage = {
        promptTokens: usageMetadata?.promptTokenCount || this.estimateTokens(messages),
        completionTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0,
      };

      if (!usage.totalTokens) {
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
      }

      return {
        content: response.text(),
        usage,
        model: config.model,
        finishReason: response.candidates?.[0]?.finishReason || undefined,
      };
    });
  }

  estimateTokens(messages: ChatMessage[]): number {
    return estimateMessagesTokens(messages);
  }
}
