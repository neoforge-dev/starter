import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Toast notification component with enhanced features
 * @element neo-toast
 *
 * @prop {string} variant - Toast variant (success, error, warning, info)
 * @prop {string} message - Toast message
 * @prop {string} title - Optional toast title
 * @prop {number} duration - Duration in milliseconds before auto-dismiss
 * @prop {boolean} dismissible - Whether the toast can be manually dismissed
 * @prop {string} position - Toast position (top-right, top-left, bottom-right, bottom-left)
 * @prop {Object} action - Optional action button configuration
 *
 * @fires dismiss - When toast is dismissed
 * @fires action - When action button is clicked
 */
export class ToastNotification extends LitElement {
  static properties = {
    message: { type: String },
    title: { type: String },
    type: { type: String },
    duration: { type: Number },
    dismissible: { type: Boolean },
    position: { type: String },
    action: { type: Object },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        position: fixed;
        z-index: var(--z-toast);
        background: var(--surface-color);
        color: var(--text-color);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        min-width: 300px;
        max-width: 400px;
        opacity: 0;
        animation: fadeInOut var(--transition-normal) forwards;
      }

      /* Position variants */
      :host([position="top-right"]) {
        top: var(--spacing-lg);
        right: var(--spacing-lg);
      }
      :host([position="top-left"]) {
        top: var(--spacing-lg);
        left: var(--spacing-lg);
      }
      :host([position="bottom-right"]) {
        bottom: var(--spacing-lg);
        right: var(--spacing-lg);
      }
      :host([position="bottom-left"]) {
        bottom: var(--spacing-lg);
        left: var(--spacing-lg);
      }

      /* Type variants */
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

      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }

      .toast-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
      }

      .toast-message {
        flex-grow: 1;
      }

      .toast-title {
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-xs);
      }

      .toast-actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
      }

      button {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      .action-button {
        background: var(--primary-color);
        color: white;
      }

      .dismiss-button {
        background: transparent;
        color: var(--text-secondary);
      }

      @keyframes fadeInOut {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        10% {
          opacity: 1;
          transform: translateY(0);
        }
        90% {
          opacity: 1;
          transform: translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateY(10px);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.message = "";
    this.title = "";
    this.type = "info";
    this.duration = 5000;
    this.dismissible = true;
    this.position = "bottom-right";
    this.action = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "alert");
    this.setAttribute("aria-live", "polite");

    if (this.duration > 0) {
      setTimeout(() => this.dismiss(), this.duration);
    }
  }

  dismiss() {
    this.dispatchEvent(new CustomEvent("dismiss"));
    this.remove();
  }

  handleAction() {
    if (this.action?.callback) {
      this.action.callback();
    }
    this.dispatchEvent(new CustomEvent("action"));
    this.dismiss();
  }

  render() {
    return html`
      <div class="toast-content">
        <div class="toast-message">
          ${this.title
            ? html`<div class="toast-title">${this.title}</div>`
            : ""}
          <div>${this.message}</div>

          <div class="toast-actions">
            ${this.action
              ? html`
                  <button class="action-button" @click=${this.handleAction}>
                    ${this.action.label}
                  </button>
                `
              : ""}
            ${this.dismissible
              ? html`
                  <button
                    class="dismiss-button"
                    @click=${this.dismiss}
                    aria-label="Dismiss notification"
                  >
                    Dismiss
                  </button>
                `
              : ""}
          </div>
        </div>
      </div>
    `;
  }
}

// Toast container to manage multiple toasts
class ToastContainer extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      z-index: var(--z-toast);
      pointer-events: none;
    }

    ::slotted(neo-toast) {
      pointer-events: auto;
      display: block;
      margin-bottom: var(--spacing-sm);
    }
  `;

  constructor() {
    super();
    this.position = "bottom-right";
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define("neo-toast-container", ToastContainer);
customElements.define("neo-toast", ToastNotification);

// Toast service for managing notifications
class ToastService {
  constructor() {
    this._containers = new Map();
    this._createContainers();
  }

  _createContainers() {
    const positions = ["top-right", "top-left", "bottom-right", "bottom-left"];
    positions.forEach((position) => {
      const container = document.createElement("neo-toast-container");
      container.position = position;
      document.body.appendChild(container);
      this._containers.set(position, container);
    });
  }

  show(options) {
    const {
      message,
      title = "",
      type = "info",
      duration = 5000,
      position = "bottom-right",
      dismissible = true,
      action = null,
    } = options;

    const toast = document.createElement("neo-toast");
    Object.assign(toast, {
      message,
      title,
      type,
      duration,
      position,
      dismissible,
      action,
    });

    toast.classList.add(type);
    const container = this._containers.get(position);
    container.appendChild(toast);

    return toast;
  }

  success(message, options = {}) {
    return this.show({ ...options, message, type: "success" });
  }

  error(message, options = {}) {
    return this.show({ ...options, message, type: "error" });
  }

  warning(message, options = {}) {
    return this.show({ ...options, message, type: "warning" });
  }

  info(message, options = {}) {
    return this.show({ ...options, message, type: "info" });
  }
}

export const toast = new ToastService();
