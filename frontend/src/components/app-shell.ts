import { LitElement, html, css, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { baseStyles } from "../styles/base.js";
import { authService } from "../services/auth.js";
import { router } from "../router.js";
import type { User } from "../types/api.d.ts";

interface AuthChangeEvent extends CustomEvent {
  detail: {
    authenticated: boolean;
    user: User | null;
  };
}

interface ThemeChangeEvent extends CustomEvent {
  detail: {
    darkMode: boolean;
  };
}

@customElement('app-shell')
export class AppShell extends LitElement {
  @property({ type: Boolean })
  isAuthenticated = false;

  @property({ type: Object })
  user: User | null = null;

  @property({ type: Boolean })
  darkMode = false;

  static override styles: CSSResultGroup = [
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
        font-family: inherit;
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
        z-index: 1000;
      }

      .user-menu-content a {
        display: block;
        padding: 0.5rem;
        text-decoration: none;
        color: var(--text-2);
        border-radius: var(--radius-1);
      }

      .user-menu-content a:hover {
        background: var(--surface-2);
        color: var(--text-1);
      }

      .icon-button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0.5rem;
        border-radius: var(--radius-1);
        transition: background-color 0.2s;
      }

      .icon-button:hover {
        background: var(--surface-2);
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

      /* Responsive design */
      @media (max-width: 768px) {
        .nav-links {
          gap: 1rem;
        }

        .nav-links a {
          font-size: 0.875rem;
        }

        main {
          padding: 1rem;
        }
      }

      /* Accessibility improvements */
      .logo:focus,
      .nav-links a:focus,
      .user-button:focus,
      .icon-button:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      /* Skip link for accessibility */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 100;
      }

      .skip-link:focus {
        top: 6px;
      }
    `,
  ];

  constructor() {
    super();
    this.isAuthenticated = authService.isAuthenticated();
    this.user = authService.getUser();
    this.darkMode = localStorage.getItem("theme") === "dark";

    // Bind methods
    this._handleAuthChange = this._handleAuthChange.bind(this);
    this._handleThemeChange = this._handleThemeChange.bind(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("auth-changed", this._handleAuthChange as EventListener);
    window.addEventListener("theme-changed", this._handleThemeChange as EventListener);

    // Initialize auth service
    authService.initialize();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("auth-changed", this._handleAuthChange as EventListener);
    window.removeEventListener("theme-changed", this._handleThemeChange as EventListener);
  }

  private _handleAuthChange(event: AuthChangeEvent): void {
    this.isAuthenticated = event.detail.authenticated;
    this.user = event.detail.user;
  }

  private _handleThemeChange(event: ThemeChangeEvent): void {
    this.darkMode = event.detail.darkMode;
  }

  private async _handleLogout(): Promise<void> {
    try {
      await authService.logout();
      // Navigation will be handled by auth service event
      router.navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  private _handleNavigation(path: string) {
    return (e: Event) => {
      e.preventDefault();
      router.navigate(path);
    };
  }

  private _toggleTheme(): void {
    const newMode = !this.darkMode;
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    window.dispatchEvent(
      new CustomEvent("theme-changed", {
        detail: { darkMode: newMode },
      })
    );
  }

  override render(): TemplateResult {
    return html`
      <a href="#main" class="skip-link">Skip to main content</a>

      <header role="banner">
        <nav role="navigation" aria-label="Main navigation">
          <a
            href="/"
            class="logo"
            @click=${this._handleNavigation("/")}
            aria-label="NeoForge - Home"
            >NeoForge</a
          >

          <div class="nav-links">
            <a
              href="/docs"
              @click=${this._handleNavigation("/docs")}
              aria-label="Documentation"
              >Docs</a
            >

            <a
              href="/components"
              @click=${this._handleNavigation("/components")}
              aria-label="Component Library"
              >Components</a
            >

            <a
              href="/examples"
              @click=${this._handleNavigation("/examples")}
              aria-label="Examples"
              >Examples</a
            >

            ${this.isAuthenticated
              ? html`
                  <div class="user-menu">
                    <button
                      class="user-button"
                      aria-label="User menu"
                      aria-expanded="false"
                      aria-haspopup="true"
                    >
                      ${this.user?.name || this.user?.email || "User"}
                      <span aria-hidden="true">▼</span>
                    </button>
                    <div class="user-menu-content" role="menu">
                      <a
                        href="/dashboard"
                        @click=${this._handleNavigation("/dashboard")}
                        role="menuitem"
                        >Dashboard</a
                      >
                      <a
                        href="/profile"
                        @click=${this._handleNavigation("/profile")}
                        role="menuitem"
                        >Profile</a
                      >
                      <a
                        href="/settings"
                        @click=${this._handleNavigation("/settings")}
                        role="menuitem"
                        >Settings</a
                      >
                      <a
                        href="#"
                        @click=${(e: Event) => {
                          e.preventDefault();
                          this._handleLogout();
                        }}
                        role="menuitem"
                        >Logout</a
                      >
                    </div>
                  </div>
                `
              : html`
                  <a
                    href="/auth/login"
                    @click=${this._handleNavigation("/auth/login")}
                    aria-label="Login"
                    >Login</a
                  >
                  <a
                    href="/auth/register"
                    @click=${this._handleNavigation("/auth/register")}
                    aria-label="Register"
                    >Register</a
                  >
                `}

            <button
              class="icon-button"
              @click=${this._toggleTheme}
              aria-label=${this.darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title=${this.darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              ${this.darkMode ? "🌞" : "🌙"}
            </button>
          </div>
        </nav>
      </header>

      <main id="main" role="main">
        <slot></slot>
      </main>

      <footer role="contentinfo">
        <p>&copy; ${new Date().getFullYear()} NeoForge. All rights reserved.</p>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
