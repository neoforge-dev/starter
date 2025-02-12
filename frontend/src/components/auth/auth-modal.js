import { LitElement, html, css } from "lit";

export class AuthModal extends LitElement {
  static properties = {
    isOpen: { type: Boolean },
    mode: { type: String }, // 'login' or 'signup'
  };

  static styles = css`
    :host {
      display: block;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s,
        visibility 0.2s;
    }

    .modal-backdrop.open {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      position: relative;
      transform: translateY(-20px);
      transition: transform 0.2s;
    }

    .modal-backdrop.open .modal-content {
      transform: translateY(0);
    }

    .close-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-color);
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .close-button:hover {
      opacity: 1;
    }

    .tabs {
      display: flex;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .tab {
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      color: var(--text-color);
      opacity: 0.7;
      transition:
        opacity 0.2s,
        border-color 0.2s;
    }

    .tab.active {
      border-bottom-color: var(--primary-color);
      opacity: 1;
    }
  `;

  constructor() {
    super();
    this.isOpen = false;
    this.mode = "login";
  }

  open(mode = "login") {
    this.mode = mode;
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  switchMode(mode) {
    this.mode = mode;
  }

  render() {
    return html`
      <div
        class="modal-backdrop ${this.isOpen ? "open" : ""}"
        @click=${(e) => e.target === e.currentTarget && this.close()}
      >
        <div class="modal-content">
          <button class="close-button" @click=${this.close}>&times;</button>

          <div class="tabs">
            <div
              class="tab ${this.mode === "login" ? "active" : ""}"
              @click=${() => this.switchMode("login")}
            >
              Login
            </div>
            <div
              class="tab ${this.mode === "signup" ? "active" : ""}"
              @click=${() => this.switchMode("signup")}
            >
              Sign Up
            </div>
          </div>

          ${this.mode === "login"
            ? html`<login-form @success=${this.close}></login-form>`
            : html`<signup-form @success=${this.close}></signup-form>`}
        </div>
      </div>
    `;
  }
}

customElements.define("auth-modal", AuthModal);
