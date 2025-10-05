import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAsyncErrorHandling, safeAsync, retryAsync, withTimeout, parallelAsync, debounceAsync, throttleAsync } from '../utils/async-handler.js';
import { Logger } from '../utils/logger.js';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withAsyncErrorHandling', () => {
    it('should handle successful async operations', async () => {
      const successFn = withAsyncErrorHandling(
        async () => 'success',
        { fallbackValue: 'fallback' }
      );

      const result = await successFn();
      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const failingFn = withAsyncErrorHandling(
        async () => {
          throw new Error('Test error');
        },
        { fallbackValue: 'fallback' }
      );

      const result = await failingFn();
      expect(result).toBe('fallback');
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const retryFn = withAsyncErrorHandling(
        async () => {
          attempts++;
          if (attempts < 3) throw new Error('Not yet');
          return 'success';
        },
        { retries: 2, retryDelay: 10 }
      );

      const result = await retryFn();
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('safeAsync', () => {
    it('should return result on success', async () => {
      const result = await safeAsync(Promise.resolve('data'), 'fallback');
      expect(result).toBe('data');
    });

    it('should return fallback on error', async () => {
      const result = await safeAsync(Promise.reject(new Error('fail')), 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('retryAsync', () => {
    it('should retry with exponential backoff', async () => {
      let attempts = 0;
      const result = await retryAsync(
        async () => {
          attempts++;
          if (attempts < 2) throw new Error('Not yet');
          return 'success';
        },
        { maxRetries: 3, initialDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should respect shouldRetry predicate', async () => {
      let attempts = 0;
      try {
        await retryAsync(
          async () => {
            attempts++;
            const error = new Error('Non-retryable');
            error.retriable = false;
            throw error;
          },
          {
            maxRetries: 3,
            shouldRetry: (error) => error.retriable !== false
          }
        );
      } catch (error) {
        expect(error.message).toBe('Non-retryable');
        expect(attempts).toBe(1); // Should not retry
      }
    });
  });

  describe('withTimeout', () => {
    it('should resolve if operation completes in time', async () => {
      const result = await withTimeout(
        Promise.resolve('data'),
        1000
      );
      expect(result).toBe('data');
    });

    it('should timeout on slow operations', async () => {
      try {
        await withTimeout(
          new Promise(resolve => setTimeout(() => resolve('data'), 1000)),
          50,
          'Custom timeout message'
        );
        throw new Error('Should have timed out');
      } catch (error) {
        expect(error.message).toBe('Custom timeout message');
      }
    });
  });

  describe('parallelAsync', () => {
    it('should execute all promises in parallel', async () => {
      const results = await parallelAsync([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle individual failures', async () => {
      const errorHandler = vi.fn();
      const results = await parallelAsync([
        Promise.resolve(1),
        Promise.reject(new Error('fail')),
        Promise.resolve(3)
      ], { onError: errorHandler });

      expect(results).toEqual([1, null, 3]);
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should fail fast if configured', async () => {
      try {
        await parallelAsync([
          Promise.resolve(1),
          Promise.reject(new Error('fail')),
          Promise.resolve(3)
        ], { failFast: true });
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.message).toBe('fail');
      }
    });
  });

  describe('debounceAsync', () => {
    it('should debounce async calls', async () => {
      let callCount = 0;
      const debouncedFn = debounceAsync(async (val) => {
        callCount++;
        return val;
      }, 50);

      debouncedFn(1);
      debouncedFn(2);
      const result = await debouncedFn(3);

      expect(result).toBe(3);
      expect(callCount).toBe(1); // Only called once after debounce
    });
  });

  describe('throttleAsync', () => {
    it('should throttle async calls', async () => {
      let callCount = 0;
      const throttledFn = throttleAsync(async (val) => {
        callCount++;
        return val;
      }, 50);

      const result1 = await throttledFn(1);
      const result2 = await throttledFn(2); // Should return cached result

      expect(result1).toBe(1);
      expect(result2).toBe(1); // Same as first call
      expect(callCount).toBe(1); // Only called once
    });
  });
});
