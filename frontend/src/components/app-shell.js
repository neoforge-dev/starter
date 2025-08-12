import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../styles/base.js";
import { authService } from "../services/auth-service.js";
import { router } from "../router.js";

class AppShell extends LitElement {
  static properties = {
    isAuthenticated: { type: Boolean },
    user: { type: Object },
    darkMode: { type: Boolean },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      header {
        background: var(--surface-1);
        border-bottom: 1px solid var(--border-color);
        padding: 1rem;
      }

      nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: var(--max-width);
        margin: 0 auto;
        width: 100%;
      }

      .logo {
        font-size: 1.5rem;
        font-weight: bold;
        text-decoration: none;
        color: var(--text-1);
      }

      .nav-links {
        display: flex;
        gap: 1.5rem;
        align-items: center;
      }

      .nav-links a {
        text-decoration: none;
        color: var(--text-2);
        transition: color 0.2s;
      }

      .nav-links a:hover {
        color: var(--text-1);
      }

      .user-menu {
        position: relative;
      }

      .user-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border: none;
        background: none;
        color: var(--text-2);
        cursor: pointer;
      }

      .user-button:hover {
        color: var(--text-1);
      }

      .user-menu-content {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--surface-1);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-2);
        padding: 0.5rem;
        min-width: 200px;
        box-shadow: var(--shadow-2);
      }

      .user-menu-content a {
        display: block;
        padding: 0.5rem;
        text-decoration: none;
        color: var(--text-2);
      }

      .user-menu-content a:hover {
        background: var(--surface-2);
        color: var(--text-1);
      }

      main {
        flex: 1;
        padding: 2rem;
        max-width: var(--max-width);
        margin: 0 auto;
        width: 100%;
      }

      footer {
        background: var(--surface-1);
        border-top: 1px solid var(--border-color);
        padding: 2rem;
        text-align: center;
        color: var(--text-2);
      }
    `,
  ];

  constructor() {
    super();
    this.isAuthenticated = authService.isAuthenticated;
    this.user = authService.user;
    this.darkMode = localStorage.getItem("theme") === "dark";

    // Bind methods
    this._handleAuthChange = this._handleAuthChange.bind(this);
    this._handleThemeChange = this._handleThemeChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("auth-changed", this._handleAuthChange);
    window.addEventListener("theme-changed", this._handleThemeChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("auth-changed", this._handleAuthChange);
    window.removeEventListener("theme-changed", this._handleThemeChange);
  }

  _handleAuthChange(event) {
    this.isAuthenticated = event.detail.authenticated;
    this.user = event.detail.user;
  }

  _handleThemeChange(event) {
    this.darkMode = event.detail.darkMode;
  }

  _handleLogout() {
    authService.logout();
  }

  render() {
    return html`
      <header>
        <nav>
          <a
            href="/"
            class="logo"
            @click=${(e) => {
              e.preventDefault();
              router.navigate("/");
            }}
            >NeoForge</a
          >

          <div class="nav-links">
            <a
              href="/docs"
              @click=${(e) => {
                e.preventDefault();
                router.navigate("/docs");
              }}
              >Docs</a
            >

            <a
              href="/components"
              @click=${(e) => {
                e.preventDefault();
                router.navigate("/components");
              }}
              >Components</a
            >

            <a
              href="/examples"
              @click=${(e) => {
                e.preventDefault();
                router.navigate("/examples");
              }}
              >Examples</a
            >

            ${this.isAuthenticated
              ? html`
                  <div class="user-menu">
                    <button class="user-button">
                      ${this.user?.name || "User"}
                      <span class="material-icons">arrow_drop_down</span>
                    </button>
                    <div class="user-menu-content">
                      <a
                        href="/dashboard"
                        @click=${(e) => {
                          e.preventDefault();
                          router.navigate("/dashboard");
                        }}
                        >Dashboard</a
                      >
                      <a
                        href="/profile"
                        @click=${(e) => {
                          e.preventDefault();
                          router.navigate("/profile");
                        }}
                        >Profile</a
                      >
                      <a
                        href="/settings"
                        @click=${(e) => {
                          e.preventDefault();
                          router.navigate("/settings");
                        }}
                        >Settings</a
                      >
                      <a href="#" @click=${this._handleLogout}>Logout</a>
                    </div>
                  </div>
                `
              : html`
                  <a
                    href="/auth/login"
                    @click=${(e) => {
                      e.preventDefault();
                      router.navigate("/auth/login");
                    }}
                    >Login</a
                  >
                  <a
                    href="/auth/register"
                    @click=${(e) => {
                      e.preventDefault();
                      router.navigate("/auth/register");
                    }}
                    >Register</a
                  >
                `}

            <button
              class="icon-button"
              @click=${() => {
                const newMode = !this.darkMode;
                document.documentElement.classList.toggle("dark", newMode);
                localStorage.setItem("theme", newMode ? "dark" : "light");
                window.dispatchEvent(
                  new CustomEvent("theme-changed", {
                    detail: { darkMode: newMode },
                  })
                );
              }}
            >
              ${this.darkMode ? "🌞" : "🌙"}
            </button>
          </div>
        </nav>
      </header>

      <main>
        <slot></slot>
      </main>

      <footer>
        <p>&copy; ${new Date().getFullYear()} NeoForge. All rights reserved.</p>
      </footer>
    `;
  }
}

customElements.define("app-shell", AppShell);
