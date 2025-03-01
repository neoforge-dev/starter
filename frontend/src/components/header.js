import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import { ThemeToggleMixin } from "../styles/theme.js";
import { router } from "../services/router.js";

export class AppHeader extends ThemeToggleMixin(LitElement) {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-lg);
        max-width: 1200px;
        margin: 0 auto;
      }
      .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--color-primary);
        text-decoration: none;
      }
      .nav-links {
        display: flex;
        gap: var(--spacing-md);
      }
      a {
        color: var(--color-text);
        text-decoration: none;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        transition: background var(--transition-fast);
      }
      a:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .theme-toggle {
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        padding: var(--spacing-sm);
        font-size: var(--font-size-lg);
      }
      .menu-toggle {
        display: none;
        font-size: var(--font-size-xl);
        cursor: pointer;
      }
      @media (max-width: 640px) {
        .nav-links {
          display: none;
          flex-direction: column;
          background-color: var(--surface-color);
          position: absolute;
          top: 100%;
          right: 0;
          box-shadow: var(--shadow-md);
        }
        .nav-links li {
          margin: var(--spacing-sm) 0;
          text-align: right;
          padding: 0 var(--spacing-md);
        }
        .menu-toggle {
          display: block;
        }
        .nav-links.open {
          display: flex;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.menuOpen = false;
  }

  render() {
    return html`
      <header>
        <nav class="container">
          <a href="/" class="logo" @click=${() => router.navigate("/")}
            >NeoForge</a
          >
          <div class="nav-links ${this.menuOpen ? "open" : ""}">
            <a href="/docs" class="nav-link">Documentation</a>
            <a href="/examples" class="nav-link">Examples</a>
            <a href="/github" class="nav-link">GitHub</a>
          </div>
          <div class="controls">
            <button
              class="theme-toggle"
              @click=${this.toggleTheme}
              aria-label="Toggle theme"
            >
              ${this.darkMode ? "🌙" : "☀️"}
            </button>
            <div
              class="menu-toggle"
              @click=${this._toggleMenu}
              aria-label="Toggle navigation menu"
            >
              &#9776;
            </div>
          </div>
        </nav>
      </header>
    `;
  }

  _toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.requestUpdate();
  }
}

customElements.define("app-header", AppHeader);
