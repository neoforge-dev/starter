import { LitElement } from "lit";

/**
 * Base component class that ensures proper shadow DOM initialization
 * and provides common functionality for all components
 */
export class BaseComponent extends LitElement {
  constructor() {
    super();
    this._initializeShadowRoot();
    this._bindEventHandlers();
  }

  _initializeShadowRoot() {
    if (!this.shadowRoot) {
      console.log(`Initializing shadow root for ${this.tagName}`);
      this.attachShadow({ mode: "open" });
    }
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
    return this.shadowRoot || this._initializeShadowRoot();
  }

  /**
   * Wait for component to be ready
   * @returns {Promise<void>}
   */
  async waitForReady() {
    console.log(`Waiting for ready ${this.tagName}`);
    await this.updateComplete;
    return this;
  }

  /**
   * Bind all event handlers
   * @private
   */
  _bindEventHandlers() {
    // Get all properties from the prototype chain
    const proto = Object.getPrototypeOf(this);
    const props = new Set();
    let currentProto = proto;

    while (currentProto && currentProto !== Object.prototype) {
      Object.getOwnPropertyNames(currentProto).forEach((prop) =>
        props.add(prop)
      );
      currentProto = Object.getPrototypeOf(currentProto);
    }

    // Bind all event handlers
    props.forEach((prop) => {
      if (
        (prop.startsWith("_handle") || prop.startsWith("handle")) &&
        typeof this[prop] === "function"
      ) {
        console.log(`Binding event handler ${prop} for ${this.tagName}`);
        this[prop] = this[prop].bind(this);
      }
    });
  }

  async getUpdateComplete() {
    console.log(`Getting update complete for ${this.tagName}`);
    const result = await super.getUpdateComplete();
    await this._ensureReady();
    return result;
  }
}

// Export a helper function to define components
export function defineComponent(tagName) {
  return function (target) {
    if (!customElements.get(tagName)) {
      console.log(`Registering component: ${tagName}`);
      customElements.define(tagName, target);
    } else {
      console.warn(`Component ${tagName} already registered`);
    }
  };
}
