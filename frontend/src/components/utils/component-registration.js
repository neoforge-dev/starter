/**
 * Component registration utilities for managing custom elements
 */

/**
 * Register a component with the custom elements registry
 * @param {string} name The name of the component
 * @param {typeof HTMLElement} component The component class
 * @returns {void}
 */
export function registerComponent(name, component) {
  try {
    // Check if already registered
    if (customElements.get(name)) {
      console.log(`Component ${name} already registered`);
      return;
    }

    // Validate component class
    if (!component || typeof component !== "function") {
      console.error(`Invalid component class for ${name}`);
      return;
    }

    // Define the custom element
    customElements.define(name, component);
    console.log(`Successfully registered component: ${name}`);
  } catch (error) {
    console.error(`Failed to register ${name}:`, error);
    throw error;
  }
}

/**
 * Decorator function to define components
 * @param {string} tagName The custom element tag name
 * @returns {Function} Class decorator function
 */
export function defineComponent(tagName) {
  return function (target) {
    registerComponent(tagName, target);
    return target;
  };
}

/**
 * Register component when DOM is ready
 * @param {string} tagName Component tag name
 * @param {Function} component Component class
 */
export function registerOnReady(tagName, component) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      registerComponent(tagName, component);
    });
  } else {
    registerComponent(tagName, component);
  }
}
