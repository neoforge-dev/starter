import { LitElement, html, css } from "lit";

export class Toast extends LitElement {
  static properties = {
    message: { type: String },
    type: { type: String },
    visible: { type: Boolean },
    duration: { type: Number },
  };

  static styles = css`
    :host {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      visibility: hidden;
      opacity: 0;
      transition:
        visibility 0s,
        opacity 0.3s ease;
    }

    :host([visible]) {
      visibility: visible;
      opacity: 1;
    }

    .toast {
      padding: 12px 24px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      min-width: 250px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .success {
      background-color: #4caf50;
    }

    .error {
      background-color: #f44336;
    }

    .info {
      background-color: #2196f3;
    }

    .warning {
      background-color: #ff9800;
    }
  `;

  constructor() {
    super();
    this.message = "";
    this.type = "info";
    this.visible = false;
    this.duration = 3000;
  }

  show(message, type = "info", duration = 3000) {
    this.message = message;
    this.type = type;
    this.duration = duration;
    this.visible = true;

    if (this.duration > 0) {
      setTimeout(() => {
        this.hide();
      }, this.duration);
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
  let toast = document.querySelector("neo-toast");

  if (!toast) {
    toast = document.createElement("neo-toast");
    document.body.appendChild(toast);
  }

  toast.show(message, type, duration);
}
