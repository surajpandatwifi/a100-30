import { useState, useCallback, useRef } from 'react';
import {
  ChatMessage,
  ModelConfig,
  StreamChunk,
  TokenUsage,
  CostEstimate,
} from '../types/llm';
import { LLMService } from '../services/llm/llmService';
import { calculateCost } from '../services/llm/pricing';

interface UseLLMServiceProps {
  llmService: LLMService;
  onStreamComplete?: (content: string, usage: TokenUsage, cost: CostEstimate) => void;
  onError?: (error: Error) => void;
}

export function useLLMService({
  llmService,
  onStreamComplete,
  onError,
}: UseLLMServiceProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [currentUsage, setCurrentUsage] = useState<TokenUsage | null>(null);
  const [currentCost, setCurrentCost] = useState<CostEstimate | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(
    async (messages: ChatMessage[], config: ModelConfig) => {
      setIsStreaming(true);
      setStreamedContent('');
      setCurrentUsage(null);
      setCurrentCost(null);

      abortControllerRef.current = new AbortController();

      let fullContent = '';

      const handleChunk = (chunk: StreamChunk) => {
        if (!chunk.isComplete) {
          fullContent += chunk.delta;
          setStreamedContent(fullContent);
        }
      };

      const handleComplete = (usage: TokenUsage) => {
        setIsStreaming(false);
        setCurrentUsage(usage);

        const cost = calculateCost(config.model, usage);
        setCurrentCost(cost);

        if (onStreamComplete) {
          onStreamComplete(fullContent, usage, cost);
        }
      };

      const handleError = (error: Error) => {
        setIsStreaming(false);
        console.error('LLM Stream Error:', error);

        if (onError) {
          onError(error);
        }
      };

      try {
        await llmService.streamChat(
          messages,
          config,
          handleChunk,
          handleComplete,
          handleError
        );
      } catch (error) {
        handleError(error as Error);
      }
    },
    [llmService, onStreamComplete, onError]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const resetStream = useCallback(() => {
    setStreamedContent('');
    setCurrentUsage(null);
    setCurrentCost(null);
  }, []);

  return {
    streamChat,
    stopStreaming,
    resetStream,
    isStreaming,
    streamedContent,
    currentUsage,
    currentCost,
  };
}
