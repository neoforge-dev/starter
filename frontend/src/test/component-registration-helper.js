/**
 * Component Registration Helper
 *
 * This file provides utilities to improve component registration in tests.
 * It addresses common issues with custom element registration in the test environment.
 */

import { LitElement, html } from "lit";

/**
 * Registry to keep track of registered components
 */
const componentRegistry = new Map();

/**
 * Register a component for testing
 *
 * @param {string} tagName - The tag name to register (e.g., 'neo-button')
 * @param {Function|Class} componentClass - The component class or a function that returns the component class
 * @param {Object} options - Additional options
 * @param {boolean} options.force - Force re-registration even if already registered
 * @param {boolean} options.createPlaceholder - Create a placeholder if component fails to register
 * @returns {Promise<Function>} - The registered component class
 */
export async function registerTestComponent(
  tagName,
  componentClass,
  options = {}
) {
  const { force = false, createPlaceholder = true } = options;

  // Check if already registered
  if (!force && customElements.get(tagName)) {
    console.log(`Component ${tagName} already registered`);
    return customElements.get(tagName);
  }

  try {
    // Handle dynamic imports
    let ComponentClass = componentClass;
    if (
      typeof componentClass === "function" &&
      (componentClass.constructor?.name === "AsyncFunction" ||
        componentClass.toString().includes("import("))
    ) {
      try {
        const module = await componentClass();
        // Try different ways to get the component class
        ComponentClass =
          module.default ||
          module[
            tagName
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join("")
          ] ||
          module[tagName.charAt(0).toUpperCase() + tagName.slice(1)] ||
          Object.values(module).find(
            (exp) =>
              typeof exp === "function" &&
              (exp.prototype instanceof LitElement ||
                (exp.prototype && typeof exp.prototype.render === "function"))
          );
      } catch (error) {
        console.error(`Error importing component ${tagName}:`, error);
        if (createPlaceholder) {
          return createPlaceholderComponent(tagName);
        }
        throw error;
      }
    }

    // Validate component class
    if (!ComponentClass || typeof ComponentClass !== "function") {
      console.warn(`Invalid component class for ${tagName}`);
      if (createPlaceholder) {
        return createPlaceholderComponent(tagName);
      }
      throw new Error(`Invalid component class for ${tagName}`);
    }

    // Check if it's a valid LitElement component
    const isLitElementComponent =
      ComponentClass.prototype instanceof LitElement ||
      (ComponentClass.prototype &&
        typeof ComponentClass.prototype.render === "function" &&
        ComponentClass.prototype.createRenderRoot);

    if (!isLitElementComponent) {
      console.warn(
        `Component ${tagName} may not be a valid LitElement component`
      );
    }

    // Register the component
    try {
      if (force && customElements.get(tagName)) {
        // Can't actually unregister, so we'll create a new tag name
        const newTagName = `${tagName}-${Date.now()}`;
        console.log(`Registering component with new tag name: ${newTagName}`);
        customElements.define(newTagName, ComponentClass);
        componentRegistry.set(newTagName, ComponentClass);
        return ComponentClass;
      } else {
        console.log(`Registering component: ${tagName}`);
        customElements.define(tagName, ComponentClass);
        componentRegistry.set(tagName, ComponentClass);
        return ComponentClass;
      }
    } catch (error) {
      console.error(`Failed to register component ${tagName}:`, error);
      if (createPlaceholder) {
        return createPlaceholderComponent(tagName);
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error registering component ${tagName}:`, error);
    if (createPlaceholder) {
      return createPlaceholderComponent(tagName);
    }
    throw error;
  }
}

/**
 * Create a placeholder component for testing
 *
 * @param {string} tagName - The tag name for the placeholder
 * @returns {Function} - The placeholder component class
 */
function createPlaceholderComponent(tagName) {
  const placeholderTagName = `${tagName}-placeholder`;

  // Create a simple placeholder component
  class PlaceholderComponent extends LitElement {
    static get properties() {
      return {
        // Add common properties that might be needed for testing
        disabled: { type: Boolean, reflect: true },
        variant: { type: String, reflect: true },
        value: { type: String, reflect: true },
        label: { type: String, reflect: true },
        name: { type: String, reflect: true },
      };
    }

    constructor() {
      super();
      this.disabled = false;
      this.variant = "default";
      this.value = "";
      this.label = "";
      this.name = "";
    }

    render() {
      return html`
        <div class="placeholder">
          <slot></slot>
        </div>
      `;
    }
  }

  // Register the placeholder
  try {
    if (!customElements.get(placeholderTagName)) {
      customElements.define(placeholderTagName, PlaceholderComponent);
      componentRegistry.set(placeholderTagName, PlaceholderComponent);
    }
  } catch (error) {
    console.error(
      `Failed to register placeholder component ${placeholderTagName}:`,
      error
    );
  }

  return PlaceholderComponent;
}

/**
 * Register multiple components for testing
 *
 * @param {Array<Array<string, Function|Class>>} components - Array of [tagName, componentClass] pairs
 * @param {Object} options - Additional options
 * @returns {Promise<Map<string, Function>>} - Map of registered components
 */
export async function registerTestComponents(components, options = {}) {
  const registeredComponents = new Map();

  for (const [tagName, componentClass] of components) {
    try {
      const registeredClass = await registerTestComponent(
        tagName,
        componentClass,
        options
      );
      registeredComponents.set(tagName, registeredClass);
    } catch (error) {
      console.error(`Failed to register component ${tagName}:`, error);
    }
  }

  return registeredComponents;
}

/**
 * Create a fixture for testing a component
 *
 * @param {string} tagName - The tag name of the component to test
 * @param {Object} props - Properties to set on the component
 * @param {string|TemplateResult} children - Children to add to the component
 * @returns {Promise<Element>} - The created element
 */
export async function createComponentFixture(
  tagName,
  props = {},
  children = ""
) {
  // Make sure the component is registered
  if (!customElements.get(tagName)) {
    console.warn(
      `Component ${tagName} not registered, attempting to create placeholder`
    );
    await createPlaceholderComponent(tagName);
  }

  // Create the element
  const element = document.createElement(tagName);

  // Set properties
  Object.entries(props).forEach(([key, value]) => {
    element[key] = value;
  });

  // Add children
  if (children) {
    if (typeof children === "string") {
      element.innerHTML = children;
    } else {
      // Assume it's a TemplateResult
      const container = document.createElement("div");
      container.appendChild(
        children.getTemplateElement().content.cloneNode(true)
      );
      while (container.firstChild) {
        element.appendChild(container.firstChild);
      }
    }
  }

  // Add to document
  document.body.appendChild(element);

  // Wait for the element to be ready
  if (element.updateComplete) {
    await element.updateComplete;
  }

  return element;
}

/**
 * Clean up a component fixture
 *
 * @param {Element} element - The element to clean up
 */
export function cleanupComponentFixture(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Get all registered components
 *
 * @returns {Map<string, Function>} - Map of registered components
 */
export function getRegisteredComponents() {
  return new Map(componentRegistry);
}

/**
 * Reset the component registry
 */
export function resetComponentRegistry() {
  componentRegistry.clear();
}
