import { Logger } from './logger.js';

/**
 * Wraps async functions with comprehensive error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Error handling options
 * @param {Function} options.errorHandler - Custom error handler
 * @param {*} options.fallbackValue - Value to return on error
 * @param {number} options.retries - Number of retry attempts (default: 0)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Function} Wrapped function with error handling
 */
export function withAsyncErrorHandling(fn, options = {}) {
  const {
    errorHandler = (error) => Logger.error('Async error:', error),
    fallbackValue = null,
    retries = 0,
    retryDelay = 1000
  } = options;

  return async function(...args) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        lastError = error;

        if (attempt < retries) {
          Logger.debug(`Retry attempt ${attempt + 1}/${retries} after error:`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          continue;
        }

        errorHandler(error);
        return fallbackValue;
      }
    }

    throw lastError;
  };
}

/**
 * Safe async execution with error boundary
 * Executes async operation and returns fallback on error
 * @param {Promise} promise - Promise to execute
 * @param {*} fallback - Fallback value on error (default: null)
 * @returns {Promise<*>} Result or fallback value
 */
export async function safeAsync(promise, fallback = null) {
  try {
    return await promise;
  } catch (error) {
    Logger.error('Safe async error:', error);
    return fallback;
  }
}

/**
 * Execute multiple async operations in parallel with error handling
 * @param {Array<Promise>} promises - Array of promises to execute
 * @param {Object} options - Options
 * @param {boolean} options.failFast - Stop on first error (default: false)
 * @param {Function} options.onError - Error handler for individual failures
 * @returns {Promise<Array>} Array of results or errors
 */
export async function parallelAsync(promises, options = {}) {
  const {
    failFast = false,
    onError = (error, index) => Logger.error(`Promise ${index} failed:`, error)
  } = options;

  if (failFast) {
    return Promise.all(promises);
  }

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      onError(result.reason, index);
      return null;
    }
  });
}

/**
 * Retry async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {Function} options.shouldRetry - Predicate to determine if error is retryable
 * @returns {Promise<*>} Result of async operation
 */
export async function retryAsync(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      Logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for async operations
 * @param {Promise} promise - Promise to execute
 * @param {number} timeout - Timeout in ms (default: 30000)
 * @param {string} message - Custom timeout message
 * @returns {Promise<*>} Result or timeout error
 */
export async function withTimeout(promise, timeout = 30000, message = 'Operation timed out') {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeout);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Debounced async execution
 * Prevents rapid-fire async calls by debouncing execution
 * @param {Function} fn - Async function to debounce
 * @param {number} delay - Debounce delay in ms (default: 300)
 * @returns {Function} Debounced async function
 */
export function debounceAsync(fn, delay = 300) {
  let timeoutId;
  let latestResolve;
  let latestReject;

  return async function(...args) {
    clearTimeout(timeoutId);

    return new Promise((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args);
          latestResolve(result);
        } catch (error) {
          latestReject(error);
        }
      }, delay);
    });
  };
}

/**
 * Throttled async execution
 * Limits execution rate of async function
 * @param {Function} fn - Async function to throttle
 * @param {number} limit - Minimum ms between executions (default: 1000)
 * @returns {Function} Throttled async function
 */
export function throttleAsync(fn, limit = 1000) {
  let inThrottle;
  let lastResult;

  return async function(...args) {
    if (!inThrottle) {
      inThrottle = true;

      try {
        lastResult = await fn.apply(this, args);
        return lastResult;
      } finally {
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    }

    return lastResult;
  };
}
