import { LitElement, html } from "lit";
import { fixture, waitForUpdate } from "@open-wc/testing-helpers";

// Export test utilities
export { fixture, waitForUpdate };

// Mock window properties and methods
global.window = {
  ...global.window,
  matchMedia: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }),
  customElements: {
    define: () => {},
    get: () => {},
  },
  localStorage: {
    _data: new Map(),
    getItem(key) {
      return this._data.get(key) || null;
    },
    setItem(key, value) {
      this._data.set(key, String(value));
    },
    removeItem(key) {
      this._data.delete(key);
    },
    clear() {
      this._data.clear();
    },
    key(index) {
      return Array.from(this._data.keys())[index] || null;
    },
    get length() {
      return this._data.size;
    },
  },
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  });

// Mock customElements registry
const customElements = {
  _registry: new Map(),
  _constructors: new Map(),
  _whenDefinedPromises: new Map(),

  define(name, constructor) {
    if (this._registry.has(name)) {
      throw new Error(`Custom element ${name} has already been defined`);
    }
    this._registry.set(name, constructor);
    this._constructors.set(constructor, name);

    const promise = this._whenDefinedPromises.get(name);
    if (promise) {
      promise.resolve();
      this._whenDefinedPromises.delete(name);
    }
  },

  get(name) {
    return this._registry.get(name);
  },

  whenDefined(name) {
    if (this._registry.has(name)) {
      return Promise.resolve();
    }

    if (!this._whenDefinedPromises.has(name)) {
      let resolve;
      const promise = new Promise((r) => (resolve = r));
      this._whenDefinedPromises.set(name, { promise, resolve });
    }

    return this._whenDefinedPromises.get(name).promise;
  },

  clear() {
    // Store original constructors to restore after clearing
    const originalConstructors = new Map(this._constructors);

    // Clear all registries
    this._registry.clear();
    this._constructors.clear();
    this._whenDefinedPromises.clear();

    // Restore original constructors with new instances
    originalConstructors.forEach((name, constructor) => {
      try {
        this.define(name, constructor);
      } catch (e) {
        console.warn(`Failed to restore custom element ${name}:`, e);
      }
    });
  },
};

// Register base LitElement if not already defined
if (!customElements.get("lit-element")) {
  customElements.define(
    "lit-element",
    class extends LitElement {
      render() {
        return html`<slot></slot>`;
      }
    }
  );
}

// Cleanup after each test
afterEach(() => {
  document.body.innerHTML = "";
  window.localStorage.clear();
  vi.clearAllMocks();
});

class CSSStyleDeclaration {
  constructor() {
    this._properties = new Map();
  }

  setProperty(propertyName, value) {
    this._properties.set(propertyName, value);
  }

  getPropertyValue(propertyName) {
    return this._properties.get(propertyName) || "";
  }

  removeProperty(propertyName) {
    const value = this._properties.get(propertyName);
    this._properties.delete(propertyName);
    return value;
  }
}

class Node {
  #parentNode = null;
  #childNodes = [];
  #isConnected = false;

  constructor() {
    if (new.target === Node) {
      throw new TypeError("Illegal constructor");
    }
  }

  get parentNode() {
    return this.#parentNode;
  }

  get childNodes() {
    return [...this.#childNodes];
  }

  get isConnected() {
    return this.#isConnected;
  }

  _setParentNode(node) {
    if (node === this) return;
    this.#parentNode = node;
    this._updateConnected();
  }

  _updateConnected() {
    const wasConnected = this.#isConnected;
    this.#isConnected = this.#parentNode ? this.#parentNode.isConnected : false;

    for (const child of this.#childNodes) {
      child._updateConnected();
    }

    if (this.#isConnected !== wasConnected) {
      if (this.#isConnected) {
        if (typeof this.connectedCallback === "function") {
          this.connectedCallback();
        }
      } else {
        if (typeof this.disconnectedCallback === "function") {
          this.disconnectedCallback();
        }
      }
    }
  }

  appendChild(node) {
    if (node === this) return node;
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    this.#childNodes.push(node);
    node._setParentNode(this);
    return node;
  }

  removeChild(node) {
    const index = this.#childNodes.indexOf(node);
    if (index === -1) {
      throw new Error("Node not found");
    }
    this.#childNodes.splice(index, 1);
    node._setParentNode(null);
    return node;
  }
}

class Element extends Node {
  #tagName;
  #attributes = new Map();
  #classList;

  constructor(tagName) {
    super();
    this.#tagName = tagName?.toUpperCase() || "";
    this.#classList = new DOMTokenList();
  }

  get tagName() {
    return this.#tagName;
  }

  getAttribute(name) {
    return this.#attributes.get(name);
  }

  setAttribute(name, value) {
    this.#attributes.set(name, value);
  }

  removeAttribute(name) {
    this.#attributes.delete(name);
  }

  get classList() {
    return this.#classList;
  }
}

class HTMLElement extends Element {
  #shadowRoot = null;
  #innerHTML = "";
  static constructing = false;

  constructor() {
    if (!HTMLElement.constructing && new.target === HTMLElement) {
      throw new TypeError("Illegal constructor");
    }
    super();
  }

  get shadowRoot() {
    return this.#shadowRoot;
  }

  get innerHTML() {
    return this.#innerHTML;
  }

  set innerHTML(value) {
    this.#innerHTML = value;
  }

  attachShadow(init) {
    if (this.#shadowRoot) {
      throw new Error("Shadow root already attached");
    }
    this.#shadowRoot = {
      mode: init.mode,
      host: this,
      innerHTML: "",
    };
    return this.#shadowRoot;
  }

  connectedCallback() {}
  disconnectedCallback() {}
  adoptedCallback() {}
  attributeChangedCallback() {}
}

class DocumentFragment extends Node {
  constructor() {
    super();
    this.nodeType = 11;
  }
}

// Update mockWindow
const mockWindow = {
  ...global.window,
  customElements: customElements,
  localStorage: localStorage,
  matchMedia: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }),
};

// Update mockDocument
const mockDocument = {
  createElement(tagName) {
    try {
      const CustomElement = customElements.get(tagName.toLowerCase());
      if (CustomElement) {
        HTMLElement.constructing = true;
        try {
          return new CustomElement();
        } finally {
          HTMLElement.constructing = false;
        }
      }

      // For non-custom elements, create a new class that extends HTMLElement
      const BaseElement = class extends HTMLElement {
        #tagName;

        constructor() {
          HTMLElement.constructing = true;
          try {
            super();
            this.#tagName = tagName.toUpperCase();
          } finally {
            HTMLElement.constructing = false;
          }
        }

        get tagName() {
          return this.#tagName;
        }
      };

      return new BaseElement();
    } catch (e) {
      console.warn(`Error creating element ${tagName}:`, e);
      throw e;
    }
  },
  createDocumentFragment() {
    return new DocumentFragment();
  },
  body: new Element("BODY"),
  head: new Element("HEAD"),
  querySelector: () => null,
  querySelectorAll: () => [],
};

// Set up global objects
global.window = mockWindow;
global.document = mockDocument;
global.customElements = customElements;
global.HTMLElement = HTMLElement;
global.Element = Element;
global.Node = Node;

// Clean up between tests
afterEach(() => {
  customElements.clear();
  localStorage.clear();
  document.body.innerHTML = "";
});
