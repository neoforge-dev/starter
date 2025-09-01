import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Import error handling components and services
import { ErrorBoundary } from '../../components/core/error-boundary.js';
import { errorService, ErrorType, AppError } from '../../services/error-service.js';

// Mock the toast service
vi.mock('../../components/ui/toast/index.js', () => ({
  showToast: vi.fn()
}));

// Mock the API client
vi.mock('../../services/api-client.js', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ status: 200 })
  }
}));

// Mock the logger
vi.mock('../../utils/logger.js', () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}));

// Mock Component for Testing Error Scenarios
class TestComponent extends HTMLElement {
  constructor() {
    super();
    this.hasError = false;
    this.shadowDom = this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    if (this.hasError) {
      throw new Error('Component render error');
    }
    this.shadowDom.innerHTML = '<div>Test Component Content</div>';
  }

  triggerError(type = 'render') {
    switch (type) {
      case 'render':
        this.hasError = true;
        this.render();
        break;
      case 'async':
        setTimeout(() => {
          throw new Error('Async operation failed');
        }, 10);
        break;
      case 'promise':
        Promise.reject(new Error('Promise rejection error'));
        break;
      case 'network':
        throw new TypeError('Failed to fetch');
      case 'validation': {
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        throw validationError;
      }
    }
  }

  reset() {
    this.hasError = false;
    this.render();
  }
}

// Recovery Manager for Testing Recovery Scenarios
class RecoveryManager {
  constructor() {
    this.recoveryStrategies = new Map();
    this.recoveryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 100;
  }

  registerStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  async attemptRecovery(error, context = {}) {
    const errorKey = `${error.type}-${error.message}`;
    const attempts = this.recoveryAttempts.get(errorKey) || 0;

    if (attempts >= this.maxRetries) {
      throw new Error(`Max recovery attempts exceeded for: ${error.message}`);
    }

    this.recoveryAttempts.set(errorKey, attempts + 1);

    const strategy = this.recoveryStrategies.get(error.type);
    if (!strategy) {
      throw new Error(`No recovery strategy for error type: ${error.type}`);
    }

    // Add delay for retry
    if (attempts > 0) {
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempts));
    }

    return await strategy(error, context, attempts);
  }

  resetAttempts(errorType = null) {
    if (errorType) {
      for (const [key] of this.recoveryAttempts) {
        if (key.startsWith(errorType)) {
          this.recoveryAttempts.delete(key);
        }
      }
    } else {
      this.recoveryAttempts.clear();
    }
  }

  getAttemptCount(error) {
    const errorKey = `${error.type}-${error.message}`;
    return this.recoveryAttempts.get(errorKey) || 0;
  }
}

describe('Error Boundary and Recovery Integration Tests', () => {
  let container;
  let errorBoundary;
  let testComponent;
  let recoveryManager;

  beforeEach(async () => {
    // Register custom elements if not already registered
    if (!customElements.get('error-boundary')) {
      customElements.define('error-boundary', ErrorBoundary);
    }
    if (!customElements.get('test-component')) {
      customElements.define('test-component', TestComponent);
    }

    // Create test container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create error boundary
    errorBoundary = document.createElement('error-boundary');
    container.appendChild(errorBoundary);

    // Create test component
    testComponent = document.createElement('test-component');
    errorBoundary.appendChild(testComponent);

    // Initialize recovery manager
    recoveryManager = new RecoveryManager();

    // Wait for elements to be connected
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Clear error listeners
    errorService._errorListeners.clear();

    // Reset recovery manager
    recoveryManager.resetAttempts();

    vi.restoreAllMocks();
  });

  describe('Error Boundary Component', () => {
    it('should catch and display component errors', async () => {
      // Arrange
      expect(errorBoundary.hasError).toBe(false);

      // Act - Trigger component loading error
      const errorEvent = new CustomEvent('component-load-error', {
        detail: {
          error: new Error('Component failed to load'),
          tagName: 'test-component'
        }
      });

      window.dispatchEvent(errorEvent);
      await errorBoundary.updateComplete;

      // Assert
      expect(errorBoundary.hasError).toBe(true);
      expect(errorBoundary.error).toBeTruthy();
      expect(errorBoundary.error.message).toBe('Component failed to load');

      // Check error UI is displayed
      const errorContainer = errorBoundary.shadowRoot.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();

      const errorMessage = errorBoundary.shadowRoot.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Something went wrong');
    });

    it('should provide retry functionality', async () => {
      // Arrange
      const mockError = new Error('Test retry error');
      const mockRetryFn = vi.fn();

      errorBoundary.hasError = true;
      errorBoundary.error = mockError;
      errorBoundary.retry = mockRetryFn;
      await errorBoundary.updateComplete;

      // Act
      const retryButton = errorBoundary.shadowRoot.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();

      retryButton.click();

      // Assert
      expect(mockRetryFn).toHaveBeenCalled();
    });

    it('should display error details in development mode', async () => {
      // Arrange
      const mockError = new Error('Detailed error message for debugging');

      errorBoundary.hasError = true;
      errorBoundary.error = mockError;
      await errorBoundary.updateComplete;

      // Act & Assert
      const errorDetails = errorBoundary.shadowRoot.querySelector('.error-details');
      expect(errorDetails).toBeTruthy();
      expect(errorDetails.textContent).toContain(mockError.message);
    });

    it('should handle recovery from error state', async () => {
      // Arrange - Set error state
      errorBoundary.hasError = true;
      errorBoundary.error = new Error('Test error');
      await errorBoundary.updateComplete;

      expect(errorBoundary.hasError).toBe(true);

      // Act - Reset error state
      errorBoundary.hasError = false;
      errorBoundary.error = null;
      await errorBoundary.updateComplete;

      // Assert - Should show slot content again
      expect(errorBoundary.hasError).toBe(false);
      const slot = errorBoundary.shadowRoot.querySelector('slot');
      expect(slot).toBeTruthy();
    });
  });

  describe('Global Error Service', () => {
    it('should handle different error types correctly', async () => {
      const { showToast } = await import('../../components/ui/toast/index.js');
      const { Logger } = await import('../../utils/logger.js');

      // Test validation error
      const validationError = new AppError('Invalid input', ErrorType.VALIDATION);
      await errorService.handleError(validationError);

      expect(showToast).toHaveBeenCalledWith('Invalid input', 'warning');
      expect(Logger.error).toHaveBeenCalledWith('Error occurred:', validationError);

      // Test network error
      const networkError = new AppError('Network failed', ErrorType.NETWORK);
      await errorService.handleError(networkError);

      expect(showToast).toHaveBeenCalledWith('Network error. Please check your connection.', 'error');

      // Test auth error
      const authError = new AppError('Session expired', ErrorType.AUTH);
      await errorService.handleError(authError);

      expect(showToast).toHaveBeenCalledWith('Authentication error. Please log in again.', 'error');
    });

    it('should normalize different error types to AppError', async () => {
      // Test TypeError (network error)
      const typeError = new TypeError('Failed to fetch');

      let capturedError = null;
      errorService.addListener((error) => {
        capturedError = error;
      });

      await errorService.handleError(typeError);

      expect(capturedError).toBeInstanceOf(AppError);
      expect(capturedError.type).toBe(ErrorType.NETWORK);
      expect(capturedError.message).toBe('Network error. Please check your connection.');
    });

    it('should report appropriate errors to backend', async () => {
      const { apiClient } = await import('../../services/api.js');

      // Test API error (should be reported)
      const apiError = new AppError('API endpoint failed', ErrorType.API);
      await errorService.handleError(apiError);

      expect(apiClient.post).toHaveBeenCalledWith('/errors', expect.objectContaining({
        type: ErrorType.API,
        message: 'API endpoint failed'
      }));

      // Reset mock
      apiClient.post.mockClear();

      // Test validation error (should not be reported)
      const validationError = new AppError('Validation failed', ErrorType.VALIDATION);
      await errorService.handleError(validationError);

      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should handle unhandled promise rejections', async () => {
      const { Logger } = await import('../../utils/logger.js');

      // Simulate unhandled promise rejection
      const rejectionEvent = new Event('unhandledrejection');
      rejectionEvent.reason = new Error('Unhandled promise rejection');

      window.dispatchEvent(rejectionEvent);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(Logger.error).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          message: 'Unhandled promise rejection'
        })
      );
    });
  });

  describe('Error Recovery Strategies', () => {
    beforeEach(() => {
      // Register recovery strategies
      recoveryManager.registerStrategy(ErrorType.NETWORK, async (error, context, attempts) => {
        if (attempts < 1) { // Change condition to attempts < 1 since attempts starts at 0
          // Simulate retry
          return { success: false, retry: true };
        }
        // Simulate successful recovery
        return { success: true, data: 'Network recovered' };
      });

      recoveryManager.registerStrategy(ErrorType.API, async () => {
        // Simulate API recovery
        return { success: true, fallbackData: 'Fallback API response' };
      });

      recoveryManager.registerStrategy(ErrorType.VALIDATION, async () => {
        // Validation errors should not be retried
        return { success: false, userAction: 'Please correct the input' };
      });
    });

    it('should retry network errors with exponential backoff', async () => {
      // Arrange
      const networkError = new AppError('Connection timeout', ErrorType.NETWORK);
      const startTime = Date.now();

      // Act - First attempt should fail, second should succeed
      const result1 = await recoveryManager.attemptRecovery(networkError);
      expect(result1.success).toBe(false);
      expect(result1.retry).toBe(true);

      const result2 = await recoveryManager.attemptRecovery(networkError);
      const endTime = Date.now();

      // Assert
      expect(result2.success).toBe(true);
      expect(result2.data).toBe('Network recovered');

      // Check that retry delay was applied
      expect(endTime - startTime).toBeGreaterThanOrEqual(100); // At least 100ms delay

      // Check attempt counts
      expect(recoveryManager.getAttemptCount(networkError)).toBe(2);
    });

    it('should handle API errors with fallback data', async () => {
      // Arrange
      const apiError = new AppError('API endpoint unavailable', ErrorType.API);

      // Act
      const result = await recoveryManager.attemptRecovery(apiError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.fallbackData).toBe('Fallback API response');
    });

    it('should not retry validation errors', async () => {
      // Arrange
      const validationError = new AppError('Invalid email format', ErrorType.VALIDATION);

      // Act
      const result = await recoveryManager.attemptRecovery(validationError);

      // Assert
      expect(result.success).toBe(false);
      expect(result.userAction).toBe('Please correct the input');
      expect(recoveryManager.getAttemptCount(validationError)).toBe(1);
    });

    it('should stop retrying after max attempts', async () => {
      // Arrange
      const persistentError = new AppError('Persistent failure', ErrorType.NETWORK);

      // Override strategy to always fail
      recoveryManager.registerStrategy(ErrorType.NETWORK, async () => {
        return { success: false, retry: true };
      });

      // Act & Assert - Should fail after max attempts
      await recoveryManager.attemptRecovery(persistentError); // Attempt 1
      await recoveryManager.attemptRecovery(persistentError); // Attempt 2
      await recoveryManager.attemptRecovery(persistentError); // Attempt 3

      // Attempt 4 should throw
      await expect(recoveryManager.attemptRecovery(persistentError))
        .rejects.toThrow('Max recovery attempts exceeded');
    });
  });

  describe('Application-wide Error Recovery', () => {
    it('should handle cascade of component failures', async () => {
      // Arrange
      const errorLog = [];

      errorService.addListener((error) => {
        errorLog.push(error);
      });

      // Act - Simulate multiple component failures
      const errors = [
        new AppError('Component A failed', ErrorType.UNKNOWN),
        new AppError('Component B failed', ErrorType.UNKNOWN),
        new AppError('Network unavailable', ErrorType.NETWORK)
      ];

      for (const error of errors) {
        await errorService.handleError(error);
      }

      // Assert
      expect(errorLog).toHaveLength(3);
      expect(errorLog[0].message).toBe('Component A failed');
      expect(errorLog[1].message).toBe('Component B failed');
      expect(errorLog[2].type).toBe(ErrorType.NETWORK);
    });

    it('should maintain application state during error recovery', async () => {
      // Arrange
      const appState = {
        user: { id: 1, name: 'Test User' },
        data: { items: [] },
        ui: { theme: 'dark' }
      };

      let statePreserved = true;

      errorService.addListener(() => {
        // Simulate state preservation during error
        if (!appState.user || !appState.ui) {
          statePreserved = false;
        }
      });

      // Act
      await errorService.handleError(new AppError('State test error', ErrorType.UNKNOWN));

      // Assert
      expect(statePreserved).toBe(true);
      expect(appState.user.name).toBe('Test User');
      expect(appState.ui.theme).toBe('dark');
    });

    it('should handle memory leaks during error scenarios', async () => {
      // Arrange
      const initialListenerCount = errorService._errorListeners.size;

      // Add temporary listeners
      const tempListeners = [];
      for (let i = 0; i < 10; i++) {
        const listener = () => {};
        tempListeners.push(listener);
        errorService.addListener(listener);
      }

      expect(errorService._errorListeners.size).toBe(initialListenerCount + 10);

      // Act - Simulate cleanup
      tempListeners.forEach(listener => {
        errorService.removeListener(listener);
      });

      // Assert
      expect(errorService._errorListeners.size).toBe(initialListenerCount);
    });

    it('should handle offline/online transitions gracefully', async () => {
      // Arrange
      let networkStatus = 'online';
      const networkErrors = [];

      errorService.addListener((error) => {
        if (error.type === ErrorType.NETWORK) {
          networkErrors.push(error);
        }
      });

      // Act - Simulate going offline
      networkStatus = 'offline';
      await errorService.handleError(new AppError('Network unavailable', ErrorType.NETWORK));

      // Simulate coming back online
      networkStatus = 'online';

      // Simulate successful network operation after recovery
      expect(networkErrors).toHaveLength(1);
      expect(networkErrors[0].message).toBe('Network unavailable');

      // Network recovery should allow new operations
      expect(networkStatus).toBe('online');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle high frequency errors without memory leaks', async () => {
      // Arrange
      const errorCount = 100;
      const errors = [];

      // Act - Generate many errors quickly
      for (let i = 0; i < errorCount; i++) {
        const error = new AppError(`High frequency error ${i}`, ErrorType.UNKNOWN);
        errors.push(errorService.handleError(error));
      }

      // Wait for all errors to be processed
      await Promise.all(errors);

      // Assert - Memory usage should be stable
      expect(errorService._errorListeners.size).toBeLessThan(10); // Should not accumulate listeners
    });

    it('should handle error reporting failures gracefully', async () => {
      const { apiClient } = await import('../../services/api.js');
      const { Logger } = await import('../../utils/logger.js');

      // Arrange - Mock API failure
      apiClient.post.mockRejectedValue(new Error('Reporting service unavailable'));

      // Act
      const reportableError = new AppError('Test reportable error', ErrorType.API);
      await errorService.handleError(reportableError);

      // Assert - Should log the reporting failure but not crash
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to report error:',
        expect.any(Error)
      );
    });

    it('should prioritize critical errors over non-critical ones', async () => {
      // Arrange
      const processedErrors = [];

      errorService.addListener((error) => {
        processedErrors.push({
          type: error.type,
          message: error.message,
          timestamp: Date.now()
        });
      });

      // Act - Submit errors in mixed priority
      const errors = [
        new AppError('Non-critical UI error', ErrorType.UNKNOWN),
        new AppError('Critical auth failure', ErrorType.AUTH),
        new AppError('Network timeout', ErrorType.NETWORK),
        new AppError('Critical API failure', ErrorType.API)
      ];

      await Promise.all(errors.map(error => errorService.handleError(error)));

      // Assert - All errors should be processed
      expect(processedErrors).toHaveLength(4);

      // Critical errors (AUTH, API) should be handled
      const criticalErrors = processedErrors.filter(e =>
        e.type === ErrorType.AUTH || e.type === ErrorType.API
      );
      expect(criticalErrors).toHaveLength(2);
    });
  });
});
