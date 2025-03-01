import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { authService } from "../../services/auth.js";
import { Logger } from "../../utils/logger.js";
import "./app-header.js";
import "./app-footer.js";
import "../auth/auth-modal.js";
import "../../pages/docs-page.js";
import { themeVariables, ThemeToggleMixin } from "@styles/theme.js";
import { property } from "lit/decorators.js";

export class AppShell extends ThemeToggleMixin(LitElement) {
  static properties = {
    currentPath: { type: String },
    user: { type: Object },
  };

  static styles = [
    themeVariables,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background-color: var(--background-color);
        color: var(--text-color);
        transition:
          background-color var(--transition-normal),
          color var(--transition-normal);
      }

      .theme-toggle {
        position: fixed;
        bottom: var(--spacing-lg);
        right: var(--spacing-lg);
        padding: var(--spacing-sm);
        border-radius: 50%;
        background-color: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        cursor: pointer;
        box-shadow: var(--shadow-md);
        transition: all var(--transition-normal);
        z-index: var(--z-fixed);
      }

      .theme-toggle:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .theme-toggle .material-icons {
        font-size: 1.5rem;
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      @media (max-width: 768px) {
        main {
          padding: var(--spacing-md);
        }

        .theme-toggle {
          bottom: var(--spacing-md);
          right: var(--spacing-md);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.currentPath = window.location.pathname;
    this.user = null;

    Logger.info("AppShell initialized");

    // Handle navigation
    window.addEventListener("popstate", () => {
      this.currentPath = window.location.pathname;
      Logger.debug(`Navigation: ${this.currentPath}`);
    });

    // Handle authentication
    authService.addListener((user) => {
      this.user = user;
      Logger.debug(`Auth state changed: ${user ? "logged in" : "logged out"}`);
    });

    // Initialize auth state
    authService.initialize().catch((error) => {
      Logger.error("Failed to initialize auth state", error);
    });
  }

  render() {
    return html`
      <div class="app-container">
        <app-header></app-header>

        <main>
          <slot></slot>
        </main>

        <app-footer></app-footer>
        <auth-modal></auth-modal>

        <button
          class="theme-toggle"
          @click=${this.toggleTheme}
          aria-label="Toggle theme"
        >
          <span class="material-icons">
            ${this.theme === "light" ? "dark_mode" : "light_mode"}
          </span>
        </button>
      </div>
    `;
  }
}

customElements.define("app-shell", AppShell);
