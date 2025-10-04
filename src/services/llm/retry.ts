import { RetryConfig } from '../../types/llm';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export class RetryableError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

function isRetryableError(error: any): boolean {
  if (error instanceof RetryableError) {
    return true;
  }

  if (error.status) {
    const status = error.status;
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }

  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  return false;
}

function getRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );

  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt === config.maxRetries) {
        throw new Error(
          `Operation failed after ${config.maxRetries} retries: ${error.message}`,
          { cause: error }
        );
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      const delay = getRetryDelay(attempt, config);
      console.warn(
        `Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError!;
}
