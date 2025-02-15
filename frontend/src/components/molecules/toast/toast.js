import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Toast component for displaying temporary notifications
 * @element neo-toast
 *
 * @prop {string} variant - Visual style (info, success, warning, error)
 * @prop {string} position - Position on screen (top-left, top-right, bottom-left, bottom-right)
 * @prop {string} message - Toast message
 * @prop {number} duration - Duration in milliseconds before auto-dismiss
 * @prop {boolean} dismissible - Whether the toast can be dismissed manually
 * @prop {boolean} icon - Whether to show the variant icon
 */
export class NeoToast extends LitElement {
  static get properties() {
    return {
      variant: { type: String },
      position: { type: String },
      message: { type: String },
      duration: { type: Number },
      dismissible: { type: Boolean },
      icon: { type: Boolean },
      _visible: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: contents;
        }

        .toast-container {
          position: fixed;
          z-index: 1000;
          pointer-events: none;
          padding: 16px;
        }

        /* Positions */
        .toast-container.top-left {
          top: 0;
          left: 0;
        }

        .toast-container.top-right {
          top: 0;
          right: 0;
        }

        .toast-container.bottom-left {
          bottom: 0;
          left: 0;
        }

        .toast-container.bottom-right {
          bottom: 0;
          right: 0;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          margin-bottom: 8px;
          pointer-events: auto;
          transform: translateX(0);
          opacity: 0;
          transition:
            transform 0.2s ease-out,
            opacity 0.2s ease-out;
        }

        .toast.visible {
          opacity: 1;
        }

        /* Variants */
        .toast.info {
          background-color: var(--color-info);
          color: white;
        }

        .toast.success {
          background-color: var(--color-success);
          color: white;
        }

        .toast.warning {
          background-color: var(--color-warning);
          color: white;
        }

        .toast.error {
          background-color: var(--color-error);
          color: white;
        }

        /* Icon */
        .toast-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .material-icons {
          font-size: 20px;
        }

        /* Content */
        .toast-content {
          flex-grow: 1;
          font-size: 14px;
          line-height: 1.4;
        }

        /* Dismiss button */
        .toast-dismiss {
          flex-shrink: 0;
          padding: 4px;
          border: none;
          background: none;
          color: currentColor;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s ease-in-out;
        }

        .toast-dismiss:hover {
          opacity: 1;
        }

        /* Animations */
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast.animating-in {
          animation: slideIn 0.2s ease-out forwards;
        }

        .toast.animating-out {
          animation: slideOut 0.2s ease-in forwards;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.variant = "info";
    this.position = "top-right";
    this.message = "";
    this.duration = 5000;
    this.dismissible = true;
    this.icon = true;
    this._visible = false;
    this._timeout = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._visible = true;
    if (this.duration > 0) {
      this._timeout = setTimeout(() => this.close(), this.duration);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
  }

  get variantIcon() {
    const icons = {
      info: "info",
      success: "check_circle",
      warning: "warning",
      error: "error",
    };
    return icons[this.variant] || "info";
  }

  close() {
    const toast = this.shadowRoot.querySelector(".toast");
    toast.classList.add("animating-out");

    toast.addEventListener(
      "animationend",
      () => {
        this._visible = false;
        this.dispatchEvent(
          new CustomEvent("neo-dismiss", {
            bubbles: true,
            composed: true,
          })
        );
      },
      { once: true }
    );
  }

  render() {
    if (!this._visible) return null;

    const containerClasses = `toast-container ${this.position}`;
    const toastClasses = `
      toast
      ${this.variant}
      ${this._visible ? "visible" : ""}
      ${this._visible ? "animating-in" : ""}
    `;

    return html`
      <div class=${containerClasses}>
        <div class=${toastClasses.trim()} role="alert" aria-live="polite">
          ${this.icon
            ? html`
                <span class="toast-icon material-icons">
                  ${this.variantIcon}
                </span>
              `
            : ""}
          <div class="toast-content">${this.message}</div>
          ${this.dismissible
            ? html`
                <button
                  class="toast-dismiss"
                  @click=${this.close}
                  aria-label="Dismiss notification"
                >
                  <span class="material-icons">close</span>
                </button>
              `
            : ""}
        </div>
      </div>
    `;
  }
}

customElements.define("neo-toast", NeoToast);
