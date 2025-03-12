import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../../styles/base.js";

/**
 * @element neo-toast
 * @description Toast notification component for displaying temporary messages
 * @property {Boolean} visible - Whether the toast is visible
 * @property {Array} messages - Array of message objects to display
 * @fires {CustomEvent} toast-show - Fired when a toast is shown
 * @fires {CustomEvent} toast-hide - Fired when a toast is hidden
 */
export class NeoToast extends LitElement {
  static properties = {
    visible: { type: Boolean, reflect: true },
    messages: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: none;
        position: fixed;
        z-index: var(--z-toast, 1000);
        top: var(--spacing-lg, 20px);
        right: var(--spacing-lg, 20px);
      }

      :host(.visible) {
        display: block;
      }

      .toast-item {
        background: var(--surface-color, white);
        color: var(--text-color, #333);
        padding: var(--spacing-md, 12px);
        border-radius: var(--radius-md, 4px);
        box-shadow: var(--shadow-lg, 0 2px 5px rgba(0, 0, 0, 0.2));
        min-width: 300px;
        max-width: 400px;
        margin-bottom: var(--spacing-sm, 8px);
        animation: fadeIn var(--transition-normal, 0.3s) forwards;
      }

      .toast-success {
        border-left: 4px solid var(--success-color, #4caf50);
      }
      .toast-error {
        border-left: 4px solid var(--error-color, #f44336);
      }
      .toast-warning {
        border-left: 4px solid var(--warning-color, #ff9800);
      }
      .toast-info {
        border-left: 4px solid var(--info-color, #2196f3);
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.visible = false;
    this.messages = [];
  }

  /**
   * Show a toast message
   * @param {Object} options - Toast options
   * @param {String} options.message - Message to display
   * @param {String} options.type - Toast type (success, error, warning, info)
   * @param {Number} options.duration - Duration in milliseconds
   */
  show({ message, type = "info", duration = 3000 }) {
    const toast = { message, type, id: Date.now() };
    this.messages = [...this.messages, toast];
    this.visible = true;
    this.classList.add("visible");
    this.dispatchEvent(new CustomEvent("toast-show"));

    if (this.messages.length > 3) {
      this.messages.shift();
    }

    if (duration) {
      setTimeout(() => this.removeToast(toast.id), duration);
    }

    this.requestUpdate();
  }

  /**
   * Remove a specific toast by ID
   * @param {Number} id - Toast ID to remove
   */
  removeToast(id) {
    this.messages = this.messages.filter((t) => t.id !== id);
    if (this.messages.length === 0) {
      this.visible = false;
      this.classList.remove("visible");
      this.dispatchEvent(new CustomEvent("toast-hide"));
    }
  }

  /**
   * Hide all toasts
   */
  hide() {
    this.visible = false;
    this.messages = [];
    this.classList.remove("visible");
    this.dispatchEvent(new CustomEvent("toast-hide"));
  }

  render() {
    return html`
      ${this.messages.map(
        (toast) => html`
          <div
            class="toast-item toast-${toast.type}"
            @click=${() => this.removeToast(toast.id)}
          >
            <div class="toast-message">${toast.message}</div>
          </div>
        `
      )}
    `;
  }
}

customElements.define("neo-toast", NeoToast);

/**
 * Helper function to show toast messages
 * @param {String} message - Message to display
 * @param {String} type - Toast type (success, error, warning, info)
 * @param {Number} duration - Duration in milliseconds
 * @returns {HTMLElement} The toast element
 */
export function showToast(message, type = "info", duration = 3000) {
  // Check if a toast container already exists
  let toastContainer = document.querySelector("neo-toast");

  // If not, create one
  if (!toastContainer) {
    toastContainer = document.createElement("neo-toast");
    document.body.appendChild(toastContainer);
  }

  // Show the toast
  toastContainer.show({ message, type, duration });

  return toastContainer;
}
