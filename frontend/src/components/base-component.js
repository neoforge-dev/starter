import { LitElement } from "lit";

/**
 * Base component class that ensures proper shadow DOM initialization
 * and provides common functionality for all components
 */
export class BaseComponent extends LitElement {
  constructor() {
    super();
    this._bindEventHandlers();
  }

  _bindEventHandlers() {
    // Override in subclasses to bind event handlers
  }

  async connectedCallback() {
    super.connectedCallback();
    console.log(`Connected callback for ${this.tagName}`);
    await this._ensureReady();
  }

  async firstUpdated(changedProperties) {
    await super.firstUpdated(changedProperties);
    console.log(`First updated for ${this.tagName}`);
    await this._ensureReady();
  }

  async _ensureReady() {
    console.log(`Ensuring ready for ${this.tagName}`);
    await this.updateComplete;
    await Promise.all(
      Array.from(this.shadowRoot?.querySelectorAll("*") || [])
        .filter((el) => el.updateComplete)
        .map((el) => el.updateComplete)
    );
  }

  /**
   * Override createRenderRoot to ensure shadow DOM is always created
   * @returns {ShadowRoot}
   */
  createRenderRoot() {
    console.log(`Creating render root for ${this.tagName}`);
    return this.attachShadow({ mode: "open" });
  }

  /**
   * Register a component with the custom elements registry
   * @param {string} name The name of the component
   * @param {typeof LitElement} component The component class to register
   */
  static registerComponent(name, component) {
    // More lenient check for LitElement components
    const isLitElementComponent =
      component &&
      typeof component === "function" &&
      // Check if it extends LitElement directly
      (component.prototype instanceof LitElement ||
        // Or check if it has LitElement's key properties/methods
        (component.prototype &&
          typeof component.prototype.render === "function" &&
          component.prototype.createRenderRoot));

    if (!isLitElementComponent) {
      console.warn(
        `Warning: Component ${name} may not be a valid LitElement, but attempting to register anyway`
      );
    }

    if (!customElements.get(name)) {
      console.log(`Registering component: ${name}`);
      try {
        customElements.define(name, component);
      } catch (error) {
        console.error(`Failed to register ${name}:`, error.message);
      }
    }
  }
}

// Export a helper function to define components
export function defineComponent(tagName) {
  return function (target) {
    try {
      if (!customElements.get(tagName)) {
        console.log(`Registering component: ${tagName}`);
        customElements.define(tagName, target);
      } else {
        console.warn(`Component ${tagName} already registered`);
      }
    } catch (error) {
      console.error(`Failed to register component ${tagName}:`, error);
      // Try to re-register the component
      try {
        customElements.define(tagName, target);
        console.log(`Successfully re-registered component: ${tagName}`);
      } catch (retryError) {
        console.error(
          `Failed to re-register component ${tagName}:`,
          retryError
        );
      }
    }
  };
}

// Export a helper function to register components
export function registerComponent(tagName, component) {
  if (customElements.get(tagName)) {
    console.warn(`Component ${tagName} already registered`);
    return;
  }

  // Wait for the custom elements registry to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      try {
        console.log(`Registering component: ${tagName}`);
        customElements.define(tagName, component);
      } catch (error) {
        console.error(`Failed to register component ${tagName}:`, error);
      }
    });
  } else {
    try {
      console.log(`Registering component: ${tagName}`);
      customElements.define(tagName, component);
    } catch (error) {
      console.error(`Failed to register component ${tagName}:`, error);
    }
  }
}
