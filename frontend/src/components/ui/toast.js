import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Toast notification component
 * @element neo-toast
 *
 * @prop {string} variant - Toast variant (success, error, warning, info)
 * @prop {string} message - Toast message
 * @prop {string} title - Optional toast title
 * @prop {number} duration - Duration in milliseconds before auto-dismiss
 * @prop {boolean} dismissible - Whether the toast can be manually dismissed
 * @prop {string} position - Toast position (top-right, top-left, bottom-right, bottom-left)
 *
 * @fires dismiss - When toast is dismissed
 */
export class ToastNotification extends LitElement {
  static properties = {
    message: { type: String },
    type: { type: String }, // success | error | info | warning
    duration: { type: Number },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        background: var(--surface-1);
        color: var(--text-color);
        padding: var(--spacing-md) var(--spacing-xl);
        border-radius: var(--radius-md);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        opacity: 0;
        animation: fadeInOut 3s forwards;
      }
      :host(.success) {
        border-left: 4px solid var(--success-color);
      }
      :host(.error) {
        border-left: 4px solid var(--error-color);
      }
      :host(.info) {
        border-left: 4px solid var(--primary-color);
      }
      :host(.warning) {
        border-left: 4px solid var(--warning-color);
      }
      @keyframes fadeInOut {
        0% {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        10% {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        90% {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.message = "";
    this.type = "info";
    this.duration = 3000;
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  render() {
    return html`<div>${this.message}</div>`;
  }
}

/**
 * Helper function to show a toast notification.
 * @param {string} message - Message text.
 * @param {string} type - Toast type (e.g. "success", "error", "info", "warning").
 * @param {number} duration - Duration in milliseconds.
 */
export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("toast-notification");
  toast.message = message;
  toast.type = type;
  toast.duration = duration;
  toast.classList.add(type);
  document.body.appendChild(toast);
}

customElements.define("toast-notification", ToastNotification);

// Create a singleton toast service
class ToastService {
  constructor() {
    this._container = document.createElement("neo-toast");
    document.body.appendChild(this._container);
  }

  show(message, type = "info", duration = 3000) {
    this._container.show(message, type, duration);
  }

  success(message, duration = 3000) {
    this.show(message, "success", duration);
  }

  error(message, duration = 3000) {
    this.show(message, "error", duration);
  }

  warning(message, duration = 3000) {
    this.show(message, "warning", duration);
  }

  info(message, duration = 3000) {
    this.show(message, "info", duration);
  }
}

export const toast = new ToastService();
