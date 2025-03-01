import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Toast extends LitElement {
  static get properties() {
    return {
      message: { type: String },
      type: { type: String },
      visible: { type: Boolean },
      duration: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        transform: translateY(150%);
        transition: transform 0.3s ease-in-out;
      }

      :host([visible]) {
        transform: translateY(0);
      }

      .toast {
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        min-width: 200px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      .success {
        background-color: var(--color-success, #4caf50);
      }

      .error {
        background-color: var(--color-error, #f44336);
      }

      .info {
        background-color: var(--color-info, #2196f3);
      }

      .warning {
        background-color: var(--color-warning, #ff9800);
      }
    `;
  }

  constructor() {
    super();
    this.message = "";
    this.type = "info";
    this.visible = false;
    this.duration = 3000;
  }

  show() {
    this.visible = true;
    if (this.duration > 0) {
      setTimeout(() => this.hide(), this.duration);
    }
  }

  hide() {
    this.visible = false;
  }

  render() {
    return html` <div class="toast ${this.type}">${this.message}</div> `;
  }
}

customElements.define("neo-toast", Toast);

// Helper function to show toast messages
export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("neo-toast");
  document.body.appendChild(toast);

  toast.message = message;
  toast.type = type;
  toast.duration = duration;
  toast.show();

  // Remove the element after it's hidden
  setTimeout(() => {
    document.body.removeChild(toast);
  }, duration + 300); // Add 300ms for the hide animation
}
