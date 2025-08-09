import {  LitElement  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

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
   * @param {typeof BaseComponent} component The component class
   * @returns {void}
   */
  static registerComponent(name, component) {
    try {
      // Validate component
      if (!component || !(component.prototype instanceof LitElement)) {
        console.warn(
          `Component ${name} may not be a valid LitElement, but attempting to register anyway`
        );
      }

      // Log registration attempt
      console.log(`Registering component: ${name}`);

      // Check if already registered
      if (customElements.get(name)) {
        console.log(`Component ${name} already registered`);
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
}

// Export the base component
export default BaseComponent;

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
  // Check if the component is already registered
  if (customElements.get(tagName)) {
    console.warn(`Component ${tagName} already registered`);
    return;
  }

  // Validate the component class
  if (!component || typeof component !== "function") {
    console.error(`Invalid component class for ${tagName}`);
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
        // Try to re-register with a new name
        try {
          const newTagName = `${tagName}-${Date.now()}`;
          console.log(`Attempting to register with new name: ${newTagName}`);
          customElements.define(newTagName, component);
        } catch (retryError) {
          console.error(
            `Failed to register component with new name:`,
            retryError
          );
        }
      }
    });
  } else {
    try {
      console.log(`Registering component: ${tagName}`);
      customElements.define(tagName, component);
    } catch (error) {
      console.error(`Failed to register component ${tagName}:`, error);
      // Try to re-register with a new name
      try {
        const newTagName = `${tagName}-${Date.now()}`;
        console.log(`Attempting to register with new name: ${newTagName}`);
        customElements.define(newTagName, component);
      } catch (retryError) {
        console.error(
          `Failed to register component with new name:`,
          retryError
        );
      }
    }
  }
}
