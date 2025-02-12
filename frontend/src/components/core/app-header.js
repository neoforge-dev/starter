import { LitElement, html, css } from "lit";
import { authService } from "../../services/auth-service.js";
import { baseStyles } from "../../styles/base.js";
import { ThemeToggleMixin } from "../../styles/theme.js";
import { router } from "../../router.js";

export class AppHeader extends ThemeToggleMixin(LitElement) {
  static properties = {
    user: { type: Object },
    isMenuOpen: { type: Boolean },
    isUserMenuOpen: { type: Boolean },
    currentPath: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: sticky;
        top: 0;
        z-index: var(--z-fixed);
        background: var(--background-color);
        border-bottom: 1px solid var(--border-color);
        transition: all var(--transition-normal);
      }

      .header-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-md) var(--spacing-lg);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        text-decoration: none;
        color: var(--text-color);
        transition: transform var(--transition-normal);
      }

      .logo-section:hover {
        transform: translateY(-2px);
      }

      .logo-section img {
        width: 36px;
        height: 36px;
      }

      .logo-text {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        background: linear-gradient(
          135deg,
          var(--primary-color),
          var(--secondary-color)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .nav-section {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
      }

      .nav-links {
        display: flex;
        gap: var(--spacing-md);
      }

      .nav-link {
        color: var(--text-secondary);
        text-decoration: none;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        transition: all var(--transition-normal);
        font-weight: var(--font-medium);
        position: relative;
      }

      .nav-link:hover {
        color: var(--text-color);
        background: var(--surface-color);
      }

      .nav-link.active {
        color: var(--primary-color);
      }

      .nav-link.active::after {
        content: "";
        position: absolute;
        bottom: -2px;
        left: var(--spacing-sm);
        right: var(--spacing-sm);
        height: 2px;
        background: var(--primary-color);
        border-radius: var(--radius-sm);
      }

      .actions-section {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .theme-toggle-btn {
        background: none;
        border: none;
        color: var(--text-color);
        padding: var(--spacing-xs);
        border-radius: 50%;
        cursor: pointer;
        transition: all var(--transition-normal);
      }

      .theme-toggle-btn:hover {
        background: var(--surface-color);
        transform: rotate(15deg);
      }

      .user-section {
        position: relative;
      }

      .user-button {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        transition: all var(--transition-normal);
      }

      .user-button:hover {
        background: var(--primary-color);
        color: var(--background-color);
        border-color: var(--primary-color);
      }

      .user-menu {
        position: absolute;
        top: calc(100% + var(--spacing-xs));
        right: 0;
        background: var(--surface-color);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        min-width: 200px;
        overflow: hidden;
        box-shadow: var(--shadow-lg);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all var(--transition-normal);
      }

      .user-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .user-menu a {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        color: var(--text-color);
        text-decoration: none;
        transition: all var(--transition-normal);
      }

      .user-menu a:hover {
        background: var(--primary-color);
        color: var(--background-color);
      }

      .user-menu .material-icons {
        font-size: var(--text-base);
      }

      .mobile-menu-button {
        display: none;
        background: none;
        border: none;
        color: var(--text-color);
        padding: var(--spacing-xs);
        cursor: pointer;
        border-radius: var(--radius-sm);
      }

      .mobile-menu-button:hover {
        background: var(--surface-color);
      }

      @media (max-width: 768px) {
        .header-container {
          padding: var(--spacing-sm);
        }

        .mobile-menu-button {
          display: block;
        }

        .nav-section {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--background-color);
          border-bottom: 1px solid var(--border-color);
          padding: var(--spacing-md);
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .nav-section.open {
          display: flex;
        }

        .nav-links {
          flex-direction: column;
          width: 100%;
        }

        .nav-link {
          padding: var(--spacing-sm) var(--spacing-md);
        }

        .actions-section {
          width: 100%;
          justify-content: space-between;
        }

        .user-section {
          width: 100%;
        }

        .user-button {
          width: 100%;
          justify-content: center;
        }

        .user-menu {
          position: static;
          width: 100%;
          margin-top: var(--spacing-xs);
          box-shadow: none;
          border: 1px solid var(--border-color);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.user = null;
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
    this.currentPath = window.location.pathname;

    // Listen for auth changes
    authService.addListener((user) => {
      this.user = user;
    });

    // Close menus when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.shadowRoot.contains(e.target)) {
        this.isMenuOpen = false;
        this.isUserMenuOpen = false;
      }
    });

    // Update current path on navigation
    window.addEventListener("popstate", () => {
      this.currentPath = window.location.pathname;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  async handleLogout() {
    try {
      await authService.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  isActive(path) {
    return this.currentPath === path;
  }

  render() {
    const navLinks = [
      { path: "/docs", label: "Documentation" },
      { path: "/components", label: "Components" },
      { path: "/examples", label: "Examples" },
      { path: "/blog", label: "Blog" },
      { path: "/community", label: "Community" },
      { path: "/projects", label: "Projects" },
      { path: "/support", label: "Support" },
    ];

    return html`
      <header>
        <div class="header-container">
          <a
            href="/"
            class="logo-section"
            @click=${(e) => {
              e.preventDefault();
              router.navigate("/");
            }}
          >
            <img src="/assets/logo.svg" alt="NeoForge Logo" />
            <span class="logo-text">NeoForge</span>
          </a>

          <button class="mobile-menu-button" @click=${this.toggleMenu}>
            <span class="material-icons"
              >${this.isMenuOpen ? "close" : "menu"}</span
            >
          </button>

          <nav class="nav-section ${this.isMenuOpen ? "open" : ""}">
            <div class="nav-links">
              ${navLinks.map(
                (link) => html`
                  <a
                    href="${link.path}"
                    class="nav-link ${this.currentPath === link.path
                      ? "active"
                      : ""}"
                    @click=${(e) => {
                      e.preventDefault();
                      router.navigate(link.path);
                      this.isMenuOpen = false;
                    }}
                    >${link.label}</a
                  >
                `
              )}
            </div>

            <div class="actions-section">
              <button
                class="theme-toggle-btn"
                @click=${this.toggleTheme}
                aria-label="Toggle theme"
              >
                <span class="material-icons">
                  ${this.theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              </button>

              ${this.user
                ? html`
                    <div class="user-section">
                      <button class="user-button" @click=${this.toggleUserMenu}>
                        <span class="material-icons">account_circle</span>
                        ${this.user.name}
                        <span class="material-icons">
                          ${this.isUserMenuOpen ? "expand_less" : "expand_more"}
                        </span>
                      </button>

                      <div
                        class="user-menu ${this.isUserMenuOpen ? "open" : ""}"
                      >
                        <a
                          href="/dashboard"
                          @click=${(e) => {
                            e.preventDefault();
                            router.navigate("/dashboard");
                            this.isUserMenuOpen = false;
                          }}
                        >
                          <span class="material-icons">dashboard</span>
                          Dashboard
                        </a>
                        <a
                          href="/profile"
                          @click=${(e) => {
                            e.preventDefault();
                            router.navigate("/profile");
                            this.isUserMenuOpen = false;
                          }}
                        >
                          <span class="material-icons">person</span>
                          Profile
                        </a>
                        <a
                          href="/settings"
                          @click=${(e) => {
                            e.preventDefault();
                            router.navigate("/settings");
                            this.isUserMenuOpen = false;
                          }}
                        >
                          <span class="material-icons">settings</span>
                          Settings
                        </a>
                        <a href="#" @click=${this.handleLogout}>
                          <span class="material-icons">logout</span>
                          Logout
                        </a>
                      </div>
                    </div>
                  `
                : html`
                    <div class="auth-buttons">
                      <neo-button
                        variant="text"
                        @click=${() => router.navigate("/auth/login")}
                        >Login</neo-button
                      >
                      <neo-button
                        variant="primary"
                        @click=${() => router.navigate("/auth/register")}
                        >Register</neo-button
                      >
                    </div>
                  `}
            </div>
          </nav>
        </div>
      </header>
    `;
  }
}

customElements.define("app-header", AppHeader);
