import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../styles/base.js";

/**
 * Component to handle PWA installation and update prompts
 * @customElement pwa-prompt
 */
export class PWAPrompt extends LitElement {
  static properties = {
    showInstall: { type: Boolean, state: true },
    showUpdate: { type: Boolean, state: true },
    installHandler: { type: Function, state: true },
    updateHandler: { type: Function, state: true },
    deferredDismissed: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: var(--spacing-md);
        transform: translateY(100%);
        transition: transform 0.3s ease-in-out;
      }

      :host([show]) {
        transform: translateY(0);
      }

      .prompt-container {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        padding: var(--spacing-lg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
        max-width: 600px;
        margin: 0 auto;
      }

      .prompt-content {
        flex: 1;
      }

      h3 {
        margin: 0 0 var(--spacing-sm);
        color: var(--color-text);
        font-size: 1.1rem;
      }

      p {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 0.9rem;
      }

      .prompt-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      button {
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--radius-sm);
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
      }

      .primary-button {
        background: var(--color-primary);
        color: white;
      }

      .primary-button:hover {
        background: var(--color-primary-dark);
      }

      .secondary-button {
        background: transparent;
        color: var(--color-text-secondary);
      }

      .secondary-button:hover {
        background: var(--color-surface-hover);
      }

      .icon {
        font-size: 2rem;
        margin-right: var(--spacing-md);
      }

      @media (max-width: 600px) {
        .prompt-container {
          flex-direction: column;
          text-align: center;
        }

        .prompt-actions {
          flex-direction: column;
          width: 100%;
        }

        button {
          width: 100%;
        }

        .icon {
          margin: 0 0 var(--spacing-sm);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.showInstall = false;
    this.showUpdate = false;
    this.deferredDismissed = false;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    window.addEventListener("pwa-install-available", (event) => {
      if (!this.deferredDismissed) {
        this.showInstall = true;
        this.installHandler = event.detail.prompt;
        this.requestUpdate();
      }
    });

    window.addEventListener("pwa-update-available", (event) => {
      this.showUpdate = true;
      this.updateHandler = event.detail.apply;
      this.requestUpdate();
    });
  }

  render() {
    if (this.showInstall) {
      return this._renderInstallPrompt();
    }

    if (this.showUpdate) {
      return this._renderUpdatePrompt();
    }

    return null;
  }

  _renderInstallPrompt() {
    return html`
      <div class="prompt-container">
        <div class="icon">📱</div>
        <div class="prompt-content">
          <h3>Install NeoForge</h3>
          <p>
            Install our app for a better experience with offline support and
            faster loading.
          </p>
        </div>
        <div class="prompt-actions">
          <button class="primary-button" @click=${this._handleInstall}>
            Install
          </button>
          <button class="secondary-button" @click=${this._handleDeferInstall}>
            Maybe Later
          </button>
        </div>
      </div>
    `;
  }

  _renderUpdatePrompt() {
    return html`
      <div class="prompt-container">
        <div class="icon">🔄</div>
        <div class="prompt-content">
          <h3>Update Available</h3>
          <p>
            A new version of NeoForge is available. Update now to get the latest
            features and improvements.
          </p>
        </div>
        <div class="prompt-actions">
          <button class="primary-button" @click=${this._handleUpdate}>
            Update Now
          </button>
          <button class="secondary-button" @click=${this._handleDeferUpdate}>
            Later
          </button>
        </div>
      </div>
    `;
  }

  async _handleInstall() {
    if (this.installHandler) {
      const installed = await this.installHandler();
      if (installed) {
        this.showInstall = false;
      }
    }
  }

  _handleDeferInstall() {
    this.showInstall = false;
    this.deferredDismissed = true;
    // Store in localStorage to remember user's choice
    localStorage.setItem("pwa-install-deferred", "true");
  }

  async _handleUpdate() {
    if (this.updateHandler) {
      await this.updateHandler();
      this.showUpdate = false;
    }
  }

  _handleDeferUpdate() {
    this.showUpdate = false;
  }
}

customElements.define("pwa-prompt", PWAPrompt);
