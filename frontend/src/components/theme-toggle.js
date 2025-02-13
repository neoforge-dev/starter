import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { ThemeToggle } from "../styles/theme.js";

class ThemeToggleButton extends ThemeToggle(LitElement) {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 8px;
      border: none;
      border-radius: var(--radius-md);
      background: var(--surface-color);
      color: var(--text-color);
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
    }

    button::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--primary-color);
      opacity: 0;
      transition: opacity var(--transition-normal);
    }

    button:hover {
      transform: translateY(-2px);
    }

    button:hover::before {
      opacity: 0.1;
    }

    button:focus {
      outline: none;
      box-shadow:
        0 0 0 2px var(--background-color),
        0 0 0 4px var(--primary-color);
    }

    button:active {
      transform: translateY(0);
    }

    .icon-container {
      position: relative;
      width: 24px;
      height: 24px;
    }

    .icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      line-height: 1;
      transition: all var(--transition-normal);
    }

    .icon.light {
      transform: ${this.theme === "dark"
        ? "rotate(-90deg) scale(0)"
        : "rotate(0) scale(1)"};
      opacity: ${this.theme === "dark" ? "0" : "1"};
    }

    .icon.dark {
      transform: ${this.theme === "dark"
        ? "rotate(0) scale(1)"
        : "rotate(90deg) scale(0)"};
      opacity: ${this.theme === "dark" ? "1" : "0"};
    }

    /* Theme transition overlay */
    .theme-transition-overlay {
      position: fixed;
      top: var(--theme-transition-origin-y, 50%);
      left: var(--theme-transition-origin-x, 50%);
      width: 0;
      height: 0;
      background: ${this.theme === "dark"
        ? "var(--background-color-dark)"
        : "var(--background-color-light)"};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: none;
    }

    :host(.transitioning) .theme-transition-overlay {
      width: calc(100vw * 2.5);
      height: calc(100vw * 2.5);
      opacity: 1;
      transition: all var(--transition-normal) cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (prefers-reduced-motion: reduce) {
      button,
      .icon,
      .theme-transition-overlay {
        transition: none !important;
      }

      button:hover {
        transform: none;
      }
    }
  `;

  constructor() {
    super();
    this._transitionEndHandler = this._handleTransitionEnd.bind(this);
    this._themeTransitionTimeout = null;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("transitionend", this._transitionEndHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("transitionend", this._transitionEndHandler);
    if (this._themeTransitionTimeout) {
      clearTimeout(this._themeTransitionTimeout);
    }
  }

  _handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    document.documentElement.style.setProperty(
      "--theme-transition-origin-x",
      `${x}px`
    );
    document.documentElement.style.setProperty(
      "--theme-transition-origin-y",
      `${y}px`
    );

    // Add transition classes
    document.documentElement.classList.add("theme-transition");
    this.classList.add("transitioning");

    // Toggle theme
    this.toggleTheme();

    // Fallback cleanup in case transition event doesn't fire
    this._themeTransitionTimeout = setTimeout(() => {
      this._handleTransitionEnd();
    }, 400);
  }

  _handleTransitionEnd(e) {
    if (!e || e.propertyName === "opacity") {
      document.documentElement.classList.remove("theme-transition");
      this.classList.remove("transitioning");
      if (this._themeTransitionTimeout) {
        clearTimeout(this._themeTransitionTimeout);
        this._themeTransitionTimeout = null;
      }
    }
  }

  render() {
    const isDark = this.theme === "dark";

    return html`
      <button
        @click=${this._handleClick}
        aria-label=${isDark ? "Switch to light theme" : "Switch to dark theme"}
        title=${isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        <div class="icon-container">
          <span class="icon light material-icons">light_mode</span>
          <span class="icon dark material-icons">dark_mode</span>
        </div>
      </button>
      <div class="theme-transition-overlay"></div>
    `;
  }
}

customElements.define("theme-toggle-button", ThemeToggleButton);
