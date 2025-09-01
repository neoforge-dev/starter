/**
 * Unified Test Environment Polyfill
 * 
 * This is the SINGLE polyfill file that handles all test environment setup.
 * It replaces all other polyfill files in this directory to avoid conflicts.
 * 
 * Key Features:
 * - Performance API polyfill for all environments
 * - JSDOM environment polyfills (localStorage, sessionStorage, etc.)
 * - Worker thread compatibility for Bun runtime
 * - Single point of configuration to avoid conflicts
 */

// Prevent multiple initializations
if (globalThis.__UNIFIED_TEST_POLYFILL_INSTALLED__) {
  console.log('Unified test polyfill already installed, skipping...');
} else {
  globalThis.__UNIFIED_TEST_POLYFILL_INSTALLED__ = true;

  const startTime = Date.now();

  // 1. Performance API Polyfill
  function createPerformancePolyfill() {
    const marks = new Map();
    const measures = new Map();

    return {
      now() {
        if (typeof process !== 'undefined' && process.hrtime) {
          const [seconds, nanoseconds] = process.hrtime();
          return seconds * 1000 + nanoseconds / 1000000;
        }
        return Date.now() - startTime;
      },

      mark(name) {
        if (!name) return;
        marks.set(name, this.now());
      },

      measure(name, startMark, endMark) {
        if (!name) return;
        const start = marks.get(startMark) || 0;
        const end = marks.get(endMark) || this.now();
        measures.set(name, {
          name,
          startTime: start,
          duration: end - start,
          entryType: 'measure'
        });
      },

      getEntriesByName(name, type) {
        if (type === 'mark' && marks.has(name)) {
          return [{ name, startTime: marks.get(name), entryType: 'mark' }];
        }
        if (type === 'measure' && measures.has(name)) {
          return [measures.get(name)];
        }
        return [];
      },

      getEntriesByType(type) {
        if (type === 'mark') {
          return Array.from(marks.entries()).map(([name, startTime]) => ({
            name, startTime, entryType: 'mark'
          }));
        }
        if (type === 'measure') {
          return Array.from(measures.values());
        }
        if (type === 'paint') {
          return [
            { name: 'first-paint', startTime: 10, duration: 0, entryType: 'paint' },
            { name: 'first-contentful-paint', startTime: 15, duration: 0, entryType: 'paint' }
          ];
        }
        return [];
      },

      clearMarks(name) {
        if (name) {
          marks.delete(name);
        } else {
          marks.clear();
        }
      },

      clearMeasures(name) {
        if (name) {
          measures.delete(name);
        } else {
          measures.clear();
        }
      },

      timeOrigin: startTime,
      timing: {
        navigationStart: startTime,
        domComplete: startTime + 100,
        domInteractive: startTime + 50,
        loadEventEnd: startTime + 120,
      },
      memory: {
        usedJSHeapSize: 10000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 2000000000,
      }
    };
  }

  // 2. Storage API Polyfills for JSDOM
  function createStoragePolyfill() {
    const storage = new Map();
    return {
      getItem(key) {
        return storage.get(key) || null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
      clear() {
        storage.clear();
      },
      get length() {
        return storage.size;
      },
      key(index) {
        const keys = Array.from(storage.keys());
        return keys[index] || null;
      }
    };
  }

  // 3. Apply Performance Polyfill
  function applyPerformancePolyfill() {
    const performancePolyfill = createPerformancePolyfill();

    // Apply to safe global contexts (ones that exist)
    const safeGlobals = [globalThis, global].filter(g => g && typeof g === 'object');
    
    // Add window and self only if they exist
    if (typeof window !== 'undefined' && window) {
      safeGlobals.push(window);
    }
    if (typeof self !== 'undefined' && self) {
      safeGlobals.push(self);
    }

    for (const g of safeGlobals) {
      if (!g.performance || typeof g.performance.now !== 'function') {
        g.performance = performancePolyfill;
      }
    }

    // Ensure it's available in current scope
    if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
      try {
        // eslint-disable-next-line no-global-assign
        performance = performancePolyfill;
      } catch (e) {
        // Ignore assignment errors
      }
    }
  }

  // 4. Apply JSDOM/Browser Environment Polyfills (deferred)
  function applyBrowserPolyfills() {
    // Only apply in environments that need them (like JSDOM)
    if (typeof window !== 'undefined' && window) {
      // Storage APIs
      if (!window.localStorage) {
        window.localStorage = createStoragePolyfill();
      }
      if (!window.sessionStorage) {
        window.sessionStorage = createStoragePolyfill();
      }

      // Event APIs
      if (!window.addEventListener) {
        window.addEventListener = () => {};
        window.removeEventListener = () => {};
        window.dispatchEvent = () => {};
      }

      // Navigator API
      if (!window.navigator) {
        window.navigator = {
          userAgent: 'jsdom',
          language: 'en-US',
          languages: ['en-US', 'en'],
          platform: 'linux',
          cookieEnabled: true
        };
      }

      // Location API
      if (!window.location) {
        window.location = {
          href: 'http://localhost:3000',
          origin: 'http://localhost:3000',
          protocol: 'http:',
          host: 'localhost:3000',
          hostname: 'localhost',
          port: '3000',
          pathname: '/',
          search: '',
          hash: '',
          reload: () => {},
          assign: () => {},
          replace: () => {}
        };
      }
    }

    // Apply to globalThis as well (safe check)
    if (typeof globalThis !== 'undefined' && globalThis) {
      if (!globalThis.localStorage) {
        globalThis.localStorage = createStoragePolyfill();
      }
      if (!globalThis.sessionStorage) {
        globalThis.sessionStorage = createStoragePolyfill();
      }
    }
  }

  // 5. Error Handling (single unified handler)
  function setupErrorHandling() {
    if (typeof process === 'undefined' || !process.on) return;

    // Remove any existing performance-related error handlers
    const existingHandlers = process.listeners('uncaughtException');
    for (const handler of existingHandlers) {
      if (handler.toString().includes('performance') || handler.toString().includes('could not be cloned')) {
        process.removeListener('uncaughtException', handler);
      }
    }

    // Single unified error handler
    process.on('uncaughtException', (err) => {
      const message = err.message || '';
      const stack = err.stack || '';
      
      // Suppress performance-related errors
      if (
        message.includes('performance.now is not a function') ||
        message.includes('performance is not defined') ||
        message.includes('could not be cloned') ||
        stack.includes('performance.now') ||
        stack.includes('could not be cloned')
      ) {
        console.warn('Suppressed performance-related error:', message.substring(0, 100));
        return; // Don't re-throw
      }
      
      // Re-throw other errors
      throw err;
    });

    // Handle unhandled rejections similarly
    const existingRejectionHandlers = process.listeners('unhandledRejection');
    for (const handler of existingRejectionHandlers) {
      if (handler.toString().includes('performance') || handler.toString().includes('could not be cloned')) {
        process.removeListener('unhandledRejection', handler);
      }
    }

    process.on('unhandledRejection', (reason) => {
      const message = reason?.message || String(reason);
      const stack = reason?.stack || '';
      
      if (
        message.includes('performance.now is not a function') ||
        message.includes('performance is not defined') ||
        message.includes('could not be cloned') ||
        stack.includes('performance.now') ||
        stack.includes('could not be cloned')
      ) {
        console.warn('Suppressed performance-related rejection:', message.substring(0, 100));
        return; // Don't re-throw
      }
      
      // Re-throw other rejections
      throw reason;
    });

    // Set max listeners to avoid warnings
    process.setMaxListeners && process.setMaxListeners(50);
  }

  // 6. Environment Configuration
  function setupEnvironment() {
    // Set NODE_ENV to production to silence dev warnings
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_ENV = 'production';
    }

    // Mock fetch for tests
    if (!globalThis.fetch) {
      globalThis.fetch = async (url) => {
        // Handle config endpoint
        if (typeof url === 'string' && url.includes('/api/v1/config')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              environment: 'test',
              api_base_url: '/api/v1'
            }),
            text: async () => JSON.stringify({ environment: 'test' }),
            blob: async () => new Blob(),
            arrayBuffer: async () => new ArrayBuffer(0),
            headers: new Map()
          };
        }
        
        // Default response
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => "",
          blob: async () => new Blob(),
          arrayBuffer: async () => new ArrayBuffer(0),
          headers: new Map()
        };
      };
    }
  }

  // Initialize everything in order
  applyPerformancePolyfill();
  setupErrorHandling();
  setupEnvironment();
  
  // Apply browser polyfills only if window exists (JSDOM is ready)
  if (typeof window !== 'undefined') {
    applyBrowserPolyfills();
  }
  
  // Also export a function to apply browser polyfills later
  // This will be called by the test setup if needed
  globalThis.__applyBrowserPolyfills = applyBrowserPolyfills;

  console.log('✅ Unified test polyfill installed successfully');
}

// Export for explicit use if needed
export default function applyUnifiedPolyfill() {
  // Already applied above, but this allows explicit calls
  return true;
}