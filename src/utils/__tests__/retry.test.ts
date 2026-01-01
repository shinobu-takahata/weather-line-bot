import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff } from '../retry';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const promise = retryWithBackoff(fn, 'Test operation');
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 5xx error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, 'Test operation');

    // 各リトライの遅延を進める
    await vi.advanceTimersByTimeAsync(1000); // 1st retry
    await vi.advanceTimersByTimeAsync(2000); // 2nd retry

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should retry on ECONNRESET error', async () => {
    const error1 = new Error('Connection reset');
    error1.message = 'ECONNRESET';
    const error2 = new Error('Connection reset');
    error2.message = 'ECONNRESET';

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error1)
      .mockRejectedValueOnce(error2)
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, 'Test operation');

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should retry on ETIMEDOUT error', async () => {
    const error = new Error('Connection timed out');
    error.message = 'ETIMEDOUT';

    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

    const promise = retryWithBackoff(fn, 'Test operation');

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 4xx error', async () => {
    const fn = vi.fn().mockRejectedValue({ response: { status: 404 } });

    const promise = retryWithBackoff(fn, 'Test operation');

    await expect(promise).rejects.toEqual({ response: { status: 404 } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retries', async () => {
    const fn = vi.fn().mockRejectedValue({ response: { status: 500 } });

    const promise = retryWithBackoff(fn, 'Test operation').catch((e) => e);

    // 最大3回リトライ（計4回実行）
    await vi.advanceTimersByTimeAsync(1000); // 1st retry
    await vi.advanceTimersByTimeAsync(2000); // 2nd retry
    await vi.advanceTimersByTimeAsync(4000); // 3rd retry

    const result = await promise;

    expect(result).toEqual({ response: { status: 500 } });
    expect(fn).toHaveBeenCalledTimes(4); // 初回 + 3回のリトライ
  });

  it('should use exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue('success');

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const promise = retryWithBackoff(fn, 'Test operation');

    await vi.advanceTimersByTimeAsync(1000); // 1st retry: 1000ms
    await vi.advanceTimersByTimeAsync(2000); // 2nd retry: 2000ms
    await vi.advanceTimersByTimeAsync(4000); // 3rd retry: 4000ms

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(4);

    // バックオフの遅延を検証
    expect(setTimeoutSpy).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 1000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 2000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), 4000);

    setTimeoutSpy.mockRestore();
  });

  it('should respect max delay', async () => {
    // 最大遅延を超える場合でも10000msに制限される
    const fn = vi
      .fn()
      .mockRejectedValue({ response: { status: 500 } });

    const promise = retryWithBackoff(fn, 'Test operation').catch((e) => e);

    // 1000 * 2^0 = 1000ms
    // 1000 * 2^1 = 2000ms
    // 1000 * 2^2 = 4000ms
    // 全て10000ms未満なので、maxDelayの制限はかからない

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    const result = await promise;

    expect(result).toEqual({ response: { status: 500 } });
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
