# Error Handling Strategy

## Overview

NeoForge implements a comprehensive, production-grade error handling system designed to gracefully handle runtime errors, async failures, and API issues while providing excellent user experience.

## Architecture

### 1. Error Boundary Component

Located at: `/frontend/src/components/core/error-boundary.js`

The global error boundary catches and handles:
- **Unhandled Promise Rejections**: Async operations that fail without catch handlers
- **Global JavaScript Errors**: Runtime errors that bubble to window
- **Component Loading Errors**: Failed component imports or initialization

**Usage:**

```javascript
// Wrap critical UI sections
<error-boundary>
  <your-component></your-component>
</error-boundary>
```

**Features:**
- Prevents entire app crashes
- User-friendly error UI with retry/reload options
- Automatic error logging and monitoring
- Event-based error propagation for custom handling

**Event API:**

```javascript
// Listen for caught errors
element.addEventListener('error-caught', (e) => {
  const { error, info } = e.detail;
  // Handle error (e.g., send to monitoring)
});

// Listen for error resets
element.addEventListener('error-reset', () => {
  // Error boundary was reset
});
```

### 2. Async Error Handler Utility

Located at: `/frontend/src/utils/async-handler.js`

Provides comprehensive async error handling patterns:

#### `withAsyncErrorHandling(fn, options)`

Wraps async functions with error handling and retry logic.

```javascript
import { withAsyncErrorHandling } from './utils/async-handler.js';

const fetchData = withAsyncErrorHandling(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    errorHandler: (error) => Logger.error('Fetch failed:', error),
    fallbackValue: [],
    retries: 2,
    retryDelay: 1000
  }
);

const data = await fetchData();
```

**Options:**
- `errorHandler`: Custom error logging function
- `fallbackValue`: Default value on final failure
- `retries`: Number of retry attempts (default: 0)
- `retryDelay`: Delay between retries in ms (default: 1000)

#### `safeAsync(promise, fallback)`

Simple error boundary for async operations.

```javascript
import { safeAsync } from './utils/async-handler.js';

// Returns data or null on error
const data = await safeAsync(fetch('/api/data'), null);

// With custom fallback
const config = await safeAsync(loadConfig(), { default: true });
```

#### `parallelAsync(promises, options)`

Execute multiple async operations with individual error handling.

```javascript
import { parallelAsync } from './utils/async-handler.js';

const results = await parallelAsync(
  [
    fetch('/api/users'),
    fetch('/api/posts'),
    fetch('/api/comments')
  ],
  {
    failFast: false, // Continue on errors
    onError: (error, index) => Logger.error(`Request ${index} failed:`, error)
  }
);
```

#### `retryAsync(fn, options)`

Retry with exponential backoff.

```javascript
import { retryAsync } from './utils/async-handler.js';

const result = await retryAsync(
  async () => await fetch('/api/critical-data'),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    shouldRetry: (error) => error.status >= 500 // Only retry server errors
  }
);
```

#### `withTimeout(promise, timeout, message)`

Add timeout to async operations.

```javascript
import { withTimeout } from './utils/async-handler.js';

try {
  const data = await withTimeout(
    fetch('/api/slow-endpoint'),
    5000,
    'Data fetch timed out'
  );
} catch (error) {
  // Handle timeout
}
```

#### `debounceAsync(fn, delay)` and `throttleAsync(fn, limit)`

Rate-limit async operations.

```javascript
import { debounceAsync, throttleAsync } from './utils/async-handler.js';

// Debounce search (waits for user to stop typing)
const debouncedSearch = debounceAsync(async (query) => {
  return await fetch(`/api/search?q=${query}`);
}, 300);

// Throttle analytics (max once per second)
const throttledTrack = throttleAsync(async (event) => {
  return await fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(event)
  });
}, 1000);
```

### 3. API Service Error Handling

Located at: `/frontend/src/services/api.js`

The API service includes enhanced error handling methods:

#### `safeGet(endpoint, options)`

Safe GET requests with automatic retry.

```javascript
import { apiService } from './services/api.js';

// Returns data or null on error
const users = await apiService.safeGet('/users');
```

#### `safePost(endpoint, data, options)`

Safe POST with error events.

```javascript
// Automatically dispatches 'api-error' event on failure
const result = await apiService.safePost('/users', { name: 'John' });
```

#### `retryRequest(endpoint, options)`

Critical requests with exponential backoff.

```javascript
// Retries up to 3 times for server errors
const data = await apiService.retryRequest('/critical-endpoint');
```

#### `timedRequest(endpoint, options, timeout)`

Requests with timeout protection.

```javascript
// Fails if request takes > 10 seconds
const data = await apiService.timedRequest('/endpoint', {}, 10000);
```

## Error Service Integration

Located at: `/frontend/src/services/error-service.js`

The error service provides:
- Centralized error handling
- User-friendly error messages
- Automatic error reporting to backend
- Error type classification (validation, network, auth, API)

**Error Types:**

```javascript
import { ErrorType, AppError } from './services/error-service.js';

// Throw typed errors
throw new AppError('Invalid email', ErrorType.VALIDATION);
throw new AppError('Session expired', ErrorType.AUTH);
throw new AppError('Network unavailable', ErrorType.NETWORK);
```

## Best Practices

### 1. Async Functions

**Always wrap async operations:**

```javascript
// ❌ Bad - no error handling
async function loadData() {
  const response = await fetch('/api/data');
  return response.json();
}

// ✅ Good - with error handling
import { withAsyncErrorHandling } from './utils/async-handler.js';

const loadData = withAsyncErrorHandling(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    fallbackValue: [],
    retries: 2
  }
);
```

### 2. Critical Operations

**Use retry logic for critical operations:**

```javascript
import { retryAsync } from './utils/async-handler.js';

// Retry payment processing
const result = await retryAsync(
  async () => await processPayment(data),
  {
    maxRetries: 3,
    shouldRetry: (error) => error.retriable
  }
);
```

### 3. User-Facing Components

**Wrap major sections with error boundaries:**

```javascript
// In your component
render() {
  return html`
    <error-boundary>
      <user-dashboard></user-dashboard>
    </error-boundary>
  `;
}
```

### 4. Fire-and-Forget Operations

**Use safeAsync for non-critical operations:**

```javascript
import { safeAsync } from './utils/async-handler.js';

// Track analytics (don't care if it fails)
await safeAsync(analytics.track('page_view'));

// Prefetch data (nice to have)
await safeAsync(cache.prefetch('/api/next-page'));
```

### 5. API Calls

**Use appropriate API service methods:**

```javascript
// Critical data - use retry
const config = await apiService.retryRequest('/config');

// User data - use safe get
const profile = await apiService.safeGet('/profile');

// Forms - use safe post with error events
const result = await apiService.safePost('/submit', formData);
```

### 6. Timeout Protection

**Add timeouts to operations that might hang:**

```javascript
import { withTimeout } from './utils/async-handler.js';

// File uploads with 60s timeout
const result = await withTimeout(
  uploadFile(file),
  60000,
  'Upload timed out'
);
```

## Error Monitoring

All errors caught by the error boundary and error service are:
1. Logged via Logger utility with full stack traces
2. Displayed to users with friendly messages
3. Reported to backend `/errors` endpoint (for critical errors)
4. Dispatched as events for custom monitoring integration

**Monitoring Integration Example:**

```javascript
// In your app initialization
import { errorService } from './services/error-service.js';

errorService.addListener((error) => {
  // Send to your monitoring service
  if (window.Sentry) {
    Sentry.captureException(error);
  }
});
```

## Testing Error Scenarios

### Trigger Error Boundary

```javascript
// Throw unhandled error
setTimeout(() => {
  throw new Error('Test error boundary');
}, 1000);

// Unhandled promise rejection
Promise.reject(new Error('Test promise rejection'));
```

### Test Async Handlers

```javascript
// Test retry logic
const failingRequest = withAsyncErrorHandling(
  async () => {
    throw new Error('Simulated failure');
  },
  { retries: 2, fallbackValue: 'fallback' }
);

const result = await failingRequest(); // Returns 'fallback' after retries
```

## Performance Considerations

- Error handlers add minimal overhead (~1-2ms per operation)
- Retry logic uses exponential backoff to avoid thundering herd
- Debounce/throttle prevent excessive async operations
- Error logging is batched in production builds

## Migration Guide

### From Unhandled Async

```javascript
// Before
async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}

// After
import { withAsyncErrorHandling } from './utils/async-handler.js';

const getData = withAsyncErrorHandling(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  { fallbackValue: [] }
);
```

### From Try-Catch Everywhere

```javascript
// Before
async function processData() {
  try {
    const data = await fetchData();
    try {
      const processed = await processData(data);
      try {
        await saveData(processed);
      } catch (saveError) {
        Logger.error('Save failed:', saveError);
      }
    } catch (processError) {
      Logger.error('Process failed:', processError);
    }
  } catch (fetchError) {
    Logger.error('Fetch failed:', fetchError);
  }
}

// After
import { safeAsync } from './utils/async-handler.js';

async function processData() {
  const data = await safeAsync(fetchData(), []);
  const processed = await safeAsync(processData(data), null);
  await safeAsync(saveData(processed));
}
```

## Summary

NeoForge's error handling system provides:

✅ **Comprehensive Coverage**: Catches all error types (sync, async, global)
✅ **Graceful Degradation**: Fallback values prevent UI breaks
✅ **Smart Retry**: Exponential backoff for transient failures
✅ **User Experience**: Friendly error messages and recovery options
✅ **Developer Experience**: Simple, composable error handling utilities
✅ **Production Ready**: Monitoring integration and error reporting

For questions or issues, refer to the source files or open an issue in the repository.
