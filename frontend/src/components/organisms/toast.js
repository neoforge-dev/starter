import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Toast notification component
 * @element neo-toast
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
        z-index: var(--z-toast);
        top: var(--spacing-lg);
        right: var(--spacing-lg);
      }

      :host(.visible) {
        display: block;
      }

      .toast-item {
        background: var(--surface-color);
        color: var(--text-color);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        min-width: 300px;
        max-width: 400px;
        margin-bottom: var(--spacing-sm);
        animation: fadeIn var(--transition-normal) forwards;
      }

      .toast-success {
        border-left: 4px solid var(--success-color);
      }
      .toast-error {
        border-left: 4px solid var(--error-color);
      }
      .toast-warning {
        border-left: 4px solid var(--warning-color);
      }
      .toast-info {
        border-left: 4px solid var(--info-color);
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

  removeToast(id) {
    this.messages = this.messages.filter((t) => t.id !== id);
    if (this.messages.length === 0) {
      this.visible = false;
      this.classList.remove("visible");
      this.dispatchEvent(new CustomEvent("toast-hide"));
    }
  }

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
