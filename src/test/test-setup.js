global.customElements = {
  get: (name) => undefined,
  define: (name, constructor) => {
    if (!customElements.get(name)) {
      // Don't call connectedCallback directly, let the element handle its own lifecycle
      const registry = new Map();
      registry.set(name, constructor);
      customElements.get = (n) => registry.get(n);
    }
  },
};

// Add document.createElement override to handle custom elements
const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName, options) => {
  const element = originalCreateElement(tagName, options);
  const constructor = customElements.get(tagName);
  if (constructor) {
    Object.setPrototypeOf(element, constructor.prototype);
    if (element.connectedCallback) {
      // Defer connectedCallback to next tick to ensure proper initialization
      setTimeout(() => element.connectedCallback(), 0);
    }
  }
  return element;
};
