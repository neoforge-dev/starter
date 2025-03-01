import { html as _html, fixture as _fixture, defineCE, waitUntil, elementUpdated, oneEvent as _oneEvent } from '@open-wc/testing';
import { expect } from 'vitest';
import { vi, beforeEach, afterEach } from 'vitest';
import { LitElement } from 'lit';
import { BaseComponent } from '../components/base-component.js';
import { waitFor } from '@testing-library/dom';

// Export test utilities
export { expect, vi, beforeEach, afterEach, waitUntil, elementUpdated };

// Handle EPIPE errors
process.on('EPIPE', () => {
  console.warn('EPIPE error caught and handled');
});

// Register marked-element if not available
if (!customElements.get('marked-element')) {
  class MarkedElement extends BaseComponent {
    render() {
      return _html`<div><slot name="markdown-html"></slot></div>`;
    }
  }
  customElements.define('marked-element', MarkedElement);
}

// Create a mock registry that supports both decorator and direct registration
const createMockRegistry = () => {
  const definitions = new Map();
  const registry = {
    define: (name, constructor) => {
      if (definitions.has(name)) {
        console.warn(`Re-registering custom element "${name}"`);
        definitions.delete(name);
      }
      definitions.set(name, constructor);
      
      // Support decorator-based registration
      if (constructor.prototype instanceof LitElement || constructor.prototype instanceof BaseComponent) {
        constructor.finalize = () => {};
        // Initialize static properties
        constructor.properties = constructor.properties || {};
        constructor.styles = constructor.styles || [];
        
        // Initialize prototype methods
        if (!constructor.prototype.createRenderRoot) {
          constructor.prototype.createRenderRoot = function() {
            return this.attachShadow({ mode: 'open' });
          };
        }
        
        // Ensure event handlers are bound
        const originalConnectedCallback = constructor.prototype.connectedCallback || (() => {});
        constructor.prototype.connectedCallback = function() {
          // Bind all event handlers
          Object.getOwnPropertyNames(Object.getPrototypeOf(this)).forEach(prop => {
            if ((prop.startsWith('_handle') || prop.startsWith('handle')) && typeof this[prop] === 'function') {
              this[prop] = this[prop].bind(this);
            }
          });
          originalConnectedCallback.call(this);
        };
      }
    },
    get: (name) => definitions.get(name),
    whenDefined: (name) => Promise.resolve(definitions.get(name)),
    upgrade: () => {},
    _definitions: definitions,
  };
  
  return registry;
};

// Setup global test environment
if (typeof window === 'undefined') {
  global.window = {};
}

// Initialize default window.auth
window.auth = {
  getCurrentUser: vi.fn().mockResolvedValue(null),
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  updatePassword: vi.fn().mockResolvedValue({ success: true }),
  updatePreferences: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue({ success: true }),
  checkEmailAvailability: vi.fn().mockResolvedValue(true),
  validatePassword: vi.fn().mockResolvedValue({ isValid: true }),
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  registerWithGoogle: vi.fn().mockResolvedValue({ success: true }),
  registerWithGithub: vi.fn().mockResolvedValue({ success: true }),
};

// Initialize default window.api
window.api = {
  getTutorials: vi.fn().mockResolvedValue({ tutorials: [] }),
  searchTutorials: vi.fn().mockResolvedValue({ results: [] }),
  getFAQ: vi.fn().mockResolvedValue({ faq: [] }),
  getOfficeLocations: vi.fn().mockResolvedValue([]),
  getDepartments: vi.fn().mockResolvedValue([]),
  submitContactForm: vi.fn().mockResolvedValue({ success: true }),
};

// Initialize default window.search
window.search = {
  search: vi.fn().mockResolvedValue([]),
  getFilters: vi.fn().mockResolvedValue({
    types: ["article", "tutorial", "doc"],
    categories: ["frontend", "backend", "devops"],
    tags: ["javascript", "python", "docker"]
  }),
  getSuggestions: vi.fn().mockResolvedValue([]),
  getRecentSearches: vi.fn().mockResolvedValue([]),
  saveSearch: vi.fn().mockResolvedValue({ success: true })
};

// Initialize default window.docs
window.docs = {
  getDocs: vi.fn().mockResolvedValue({
    sections: [],
    metadata: {
      version: "1.0.0",
      lastUpdated: "2024-03-15",
      contributors: []
    }
  }),
  getSection: vi.fn().mockResolvedValue(null),
  getSubsection: vi.fn().mockResolvedValue(null),
  searchDocs: vi.fn().mockResolvedValue([]),
  reportIssue: vi.fn().mockResolvedValue({ success: true, ticketId: "TEST-123" })
};

if (!window.customElements) {
  window.customElements = createMockRegistry();
}

// Mock server responses
const mockServer = {
  get: vi.fn().mockImplementation((url) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
      headers: new Headers({ "content-type": "application/json" })
    });
  }),
  post: vi.fn().mockImplementation((url) => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: "test" }),
    headers: new Headers({ "content-type": "application/json" })
  })),
  put: vi.fn().mockImplementation((url) => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: "test" }),
    headers: new Headers({ "content-type": "application/json" })
  })),
  delete: vi.fn().mockImplementation((url) => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: "test" }),
    headers: new Headers({ "content-type": "application/json" })
  })),
  patch: vi.fn().mockImplementation((url) => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: "test" }),
    headers: new Headers({ "content-type": "application/json" })
  }))
};

// Mock fetch
global.fetch = vi.fn((url, options = {}) => {
  const method = (options.method || "GET").toLowerCase();
  return mockServer[method](url);
});

// Enhanced test utilities
export class TestUtils {
  static async waitForShadowDom(element) {
    if (!element) return null;
    
    // Wait for element to be connected
    await element.updateComplete;
    
    // Wait for shadow root
    if (!element.shadowRoot) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return element.shadowRoot;
  }

  static async waitForComponent(element) {
    if (!element) return;
    
    // Wait for connectedCallback
    if (element.connectedCallback) {
      await element.connectedCallback();
    }

    // Wait for shadow root and updates
    if (element.updateComplete) {
      await element.updateComplete;
    }

    // Wait for any child components
    if (element.shadowRoot) {
      const children = element.shadowRoot.querySelectorAll('*');
      for (const child of children) {
        if (child.updateComplete) {
          await child.updateComplete;
        }
      }
    }
  }

  static async waitForAll(element) {
    if (!element) return;
    
    await this.waitForComponent(element);
    
    // Wait for all child components
    const children = element.shadowRoot ? 
      element.shadowRoot.querySelectorAll('*') : 
      element.querySelectorAll('*');
      
    for (const child of children) {
      if (child.tagName && child.tagName.includes('-')) {
        await this.waitForComponent(child);
      }
    }
  }

  static async fixture(template) {
    const element = await _fixture(template);
    await this.waitForAll(element);
    return element;
  }

  static async oneEvent(element, eventName) {
    return _oneEvent(element, eventName);
  }

  static async queryComponent(container, selector) {
    if (!container || !selector) {
      return null;
    }
    
    await this.waitForComponent(container);
    
    const element = container.shadowRoot ? 
      container.shadowRoot.querySelector(selector) :
      container.querySelector(selector);
      
    if (element) {
      await this.waitForComponent(element);
    }
    
    return element;
  }

  static async queryAllComponents(container, selector) {
    if (!container || !selector) {
      return [];
    }
    
    await this.waitForComponent(container);
    
    const elements = container.shadowRoot ?
      container.shadowRoot.querySelectorAll(selector) :
      container.querySelectorAll(selector);
      
    for (const element of elements) {
      await this.waitForComponent(element);
    }
    
    return elements;
  }

  static mockResponse(data, status = 200) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    });
  }

  static mockError(status, message) {
    return Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    });
  }

  static mockNetworkError() {
    return Promise.reject(new Error("Network error"));
  }

  static get mockServer() {
    return mockServer;
  }
}

// Reset custom elements registry before each test
beforeEach(() => {
  const mockRegistry = createMockRegistry();
  Object.defineProperty(window, 'customElements', {
    value: mockRegistry,
    configurable: true,
    writable: true
  });
  vi.clearAllMocks();
  mockServer.get.mockImplementation(() => TestUtils.mockResponse({}));
  mockServer.post.mockImplementation(() => TestUtils.mockResponse({}));
  mockServer.put.mockImplementation(() => TestUtils.mockResponse({}));
  mockServer.delete.mockImplementation(() => TestUtils.mockResponse({}));
});

// Restore original registry after each test
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

// Add global test utilities
window.TestUtils = TestUtils;
window.html = _html;

// Export html for use in tests
export const html = _html;

// Mock the CDN import to redirect to local node_modules
vi.mock('https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js', async () => {
  const actual = await vi.importActual('lit');
  return actual;
});

// Create a basic document if it doesn't exist
if (!globalThis.document) {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.customElements = dom.window.customElements;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Event = dom.window.Event;
  globalThis.Node = dom.window.Node;
  globalThis.navigator = dom.window.navigator;
}

// Mock MutationObserver if it doesn't exist
if (!globalThis.MutationObserver) {
  globalThis.MutationObserver = class MutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.observations = [];
    }
    observe(element, options) {
      this.observations.push({ element, options });
    }
    disconnect() {
      this.observations = [];
    }
    trigger(mutations) {
      this.callback(mutations, this);
    }
  };
}

// Mock ResizeObserver if it doesn't exist
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observations = [];
    }
    observe(element, options) {
      this.observations.push({ element, options });
    }
    unobserve(element) {
      this.observations = this.observations.filter(obs => obs.element !== element);
    }
    disconnect() {
      this.observations = [];
    }
  };
}

// Mock IntersectionObserver if it doesn't exist
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.observations = [];
    }
    observe(element) {
      this.observations.push(element);
    }
    unobserve(element) {
      this.observations = this.observations.filter(obs => obs !== element);
    }
    disconnect() {
      this.observations = [];
    }
  };
}

// Mock fetch function
globalThis.fetch = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  });
});

// Helper function to wait for element update
export async function waitForUpdate(element) {
  if (element?.updateComplete) {
    await element.updateComplete;
  }
  return waitFor(() => {}, { timeout: 100 }).catch(() => {});
}

// Register base LitElement if not already defined
if (!customElements.get('lit-element')) {
  class BaseLitElement extends LitElement {}
  customElements.define('lit-element', BaseLitElement);
}

// Vitest lifecycle hooks for test setup
beforeEach(() => {
  // Clean up any document content before each test
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Export necessary utilities for tests
export { html, css, LitElement };
