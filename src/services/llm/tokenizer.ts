import { ChatMessage } from '../../types/llm';

export function estimateTokenCount(text: string): number {
  const avgCharsPerToken = 4;
  return Math.ceil(text.length / avgCharsPerToken);
}

export function estimateMessagesTokens(messages: ChatMessage[]): number {
  let totalTokens = 0;

  for (const message of messages) {
    totalTokens += estimateTokenCount(message.content);
    totalTokens += 4;
  }

  totalTokens += 3;

  return totalTokens;
}
