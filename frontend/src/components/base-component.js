import { LitElement } from "lit";

/**
 * Base component class that provides common lifecycle management
 * and utilities for all components.
 */
export class BaseComponent extends LitElement {
  constructor() {
    super();
    this._bindEventHandlers();
  }

  /**
   * Override in subclasses to bind event handlers
   */
  _bindEventHandlers() {
    // Override in subclasses to bind event handlers
  }

  /**
   * Enhanced connectedCallback with component readiness
   */
  async connectedCallback() {
    super.connectedCallback();
    if (process.env.NODE_ENV === 'development') {
      console.log(`Connected: ${this.tagName}`);
    }
    await this._ensureReady();
  }

  /**
   * Enhanced firstUpdated with component readiness
   */
  async firstUpdated(changedProperties) {
    await super.firstUpdated(changedProperties);
    if (process.env.NODE_ENV === 'development') {
      console.log(`First updated: ${this.tagName}`);
    }
    await this._ensureReady();
  }

  /**
   * Ensure all nested components are ready
   */
  async _ensureReady() {
    await this.updateComplete;
    
    // Wait for nested components to be ready
    const nestedComponents = Array.from(this.shadowRoot?.querySelectorAll("*") || [])
      .filter((el) => el.updateComplete);
    
    if (nestedComponents.length > 0) {
      await Promise.all(nestedComponents.map((el) => el.updateComplete));
    }
  }

  /**
   * Override createRenderRoot to ensure shadow DOM is always created
   */
  createRenderRoot() {
    return this.attachShadow({ mode: "open" });
  }
}

export default BaseComponent;
