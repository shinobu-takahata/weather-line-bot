import { RETRY_CONFIG } from '../config/constants';
import { Logger } from './logger';

/**
 * リトライ可能なエラーかどうか判定
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // ネットワークエラー
    if (
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return true;
    }
  }

  // axios エラーの場合
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status: number } }).response;
    if (response && response.status >= 500 && response.status < 600) {
      return true;
    }
  }

  return false;
}

/**
 * 指数バックオフでリトライ
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operation: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(
        RETRY_CONFIG.initialDelayMs *
          Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelayMs
      );

      Logger.warn(`${operation} failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: RETRY_CONFIG.maxRetries,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
