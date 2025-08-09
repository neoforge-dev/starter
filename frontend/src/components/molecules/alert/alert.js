import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Alert component for displaying messages and notifications
 * @element neo-alert
 *
 * @prop {string} variant - Visual style (info, success, warning, error)
 * @prop {string} title - Alert title
 * @prop {boolean} dismissible - Whether the alert can be dismissed
 * @prop {boolean} icon - Whether to show the variant icon
 * @prop {boolean} elevated - Whether to show elevation shadow
 */
export class NeoAlert extends LitElement {
  static get properties() {
    return {
      variant: { type: String },
      title: { type: String },
      dismissible: { type: Boolean },
      icon: { type: Boolean },
      elevated: { type: Boolean },
      _visible: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .alert {
          position: relative;
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          animation: slideIn 0.2s ease-out;
        }

        .alert.elevated {
          box-shadow: var(--shadow-sm);
        }

        /* Variants */
        .alert.info {
          background-color: var(--color-info-light);
          border-color: var(--color-info);
          color: var(--color-info-dark);
        }

        .alert.success {
          background-color: var(--color-success-light);
          border-color: var(--color-success);
          color: var(--color-success-dark);
        }

        .alert.warning {
          background-color: var(--color-warning-light);
          border-color: var(--color-warning);
          color: var(--color-warning-dark);
        }

        .alert.error {
          background-color: var(--color-error-light);
          border-color: var(--color-error);
          color: var(--color-error-dark);
        }

        /* Content layout */
        .alert-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .alert-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-body {
          flex-grow: 1;
        }

        .alert-title {
          margin: 0 0 4px 0;
          font-weight: 600;
        }

        .alert-message {
          margin: 0;
        }

        /* Dismiss button */
        .alert-dismiss {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px;
          border: none;
          background: none;
          color: currentColor;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s ease-in-out;
        }

        .alert-dismiss:hover {
          opacity: 1;
        }

        /* Icons */
        .material-icons {
          font-size: 20px;
        }

        /* Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
          }
        }

        .alert.dismissing {
          animation: slideOut 0.2s ease-in forwards;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.variant = "info";
    this.title = "";
    this.dismissible = false;
    this.icon = true;
    this.elevated = false;
    this._visible = true;
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

  _handleDismiss() {
    const alert = this.shadowRoot.querySelector(".alert");
    alert.classList.add("dismissing");

    alert.addEventListener(
      "animationend",
      () => {
        this.dispatchEvent(
          new CustomEvent("neo-dismiss", {
            bubbles: true,
            composed: true,
            detail: true,
          })
        );
        this._visible = false;
      },
      { once: true }
    );
  }

  render() {
    if (!this._visible) return null;

    const alertClasses = `
      alert
      ${this.variant}
      ${this.elevated ? "elevated" : ""}
    `;

    return html`
      <div class=${alertClasses.trim()} role="alert" aria-live="polite">
        <div class="alert-content">
          ${this.icon
            ? html`
                <span class="alert-icon material-icons">
                  ${this.variantIcon}
                </span>
              `
            : ""}
          <div class="alert-body">
            ${this.title
              ? html`<h4 class="alert-title">${this.title}</h4>`
              : ""}
            <div class="alert-message">
              <slot></slot>
            </div>
          </div>
        </div>
        ${this.dismissible
          ? html`
              <button
                class="alert-dismiss"
                aria-label="Dismiss alert"
                @click=${this._handleDismiss}
              >
                <span class="material-icons">close</span>
              </button>
            `
          : ""}
      </div>
    `;
  }
}

customElements.define("neo-alert", NeoAlert);
