import { LitElement, html, css } from "lit";
import { ThemeToggleMixin } from "../styles/theme.js";

export class ThemeToggleButton extends ThemeToggleMixin(LitElement) {
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

    button:focus-visible {
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
      transform-style: preserve-3d;
      transition: transform var(--transition-normal)
        cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host(.transitioning) .icon-container {
      transform: rotateY(180deg);
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
      backface-visibility: hidden;
      transition: opacity var(--transition-normal);
    }

    .icon.light {
      transform: rotateY(0);
    }

    .icon.dark {
      transform: rotateY(180deg);
    }

    /* Theme transition overlay */
    .theme-transition-overlay {
      position: fixed;
      top: var(--theme-transition-origin-y, 50%);
      left: var(--theme-transition-origin-x, 50%);
      width: 0;
      height: 0;
      background: var(--theme-transition-background);
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
      .icon-container,
      .icon,
      .theme-transition-overlay {
        transition: none !important;
      }

      button:hover {
        transform: none;
      }

      :host(.transitioning) .icon-container {
        transform: none;
      }
    }
  `;

  constructor() {
    super();
    this._transitionEndHandler = this._handleTransitionEnd.bind(this);
    this._themeTransitionTimeout = null;
    this._prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Initialize theme-related DOM attributes
    if (!document.documentElement.hasAttribute("data-theme")) {
      document.documentElement.setAttribute(
        "data-theme",
        this.darkMode ? "dark" : "light"
      );
    }

    // Ensure theme property is synced with darkMode
    if (this.darkMode) {
      this.theme = "dark";
    } else {
      this.theme = "light";
    }
  }

  // Force the theme property to stay in sync with darkMode
  updated(changedProperties) {
    super.updated?.(changedProperties);

    if (changedProperties.has("darkMode")) {
      this.theme = this.darkMode ? "dark" : "light";
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("transitionend", this._transitionEndHandler);
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addListener(this._handleReducedMotionChange.bind(this));
    this._updateTransitionBackground();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("transitionend", this._transitionEndHandler);
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .removeListener(this._handleReducedMotionChange.bind(this));
  }

  _handleReducedMotionChange(e) {
    this._prefersReducedMotion = e.matches;
  }

  _updateTransitionBackground() {
    this.style.setProperty(
      "--theme-transition-background",
      this.theme === "dark"
        ? "var(--background-color-light)"
        : "var(--background-color-dark)"
    );
  }

  _handleClick(e) {
    if (this._prefersReducedMotion) {
      this.toggleTheme();
      return;
    }

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

    // Update transition background before animation
    this._updateTransitionBackground();

    // Add transition classes - ensure this happens synchronously
    document.documentElement.classList.add("theme-transition");
    this.classList.add("transitioning");

    // Toggle theme
    setTimeout(() => {
      this.toggleTheme();

      // Announce theme change to screen readers
      this._announceThemeChange();
    }, 0);

    // Fallback cleanup in case transition event doesn't fire
    this._themeTransitionTimeout = setTimeout(() => {
      this._handleTransitionEnd();
    }, 400);
  }

  _handleTransitionEnd(e) {
    // Always remove the classes regardless of which event triggered this
    document.documentElement.classList.remove("theme-transition");
    this.classList.remove("transitioning");

    if (this._themeTransitionTimeout) {
      clearTimeout(this._themeTransitionTimeout);
      this._themeTransitionTimeout = null;
    }
  }

  _announceThemeChange() {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.style.position = "absolute";
    announcement.style.width = "1px";
    announcement.style.height = "1px";
    announcement.style.padding = "0";
    announcement.style.margin = "-1px";
    announcement.style.overflow = "hidden";
    announcement.style.clip = "rect(0, 0, 0, 0)";
    announcement.style.whiteSpace = "nowrap";
    announcement.style.border = "0";
    announcement.textContent = `Switched to ${this.theme} theme`;

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 3000);
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
          <span class="icon light material-icons" aria-hidden="true"
            >light_mode</span
          >
          <span class="icon dark material-icons" aria-hidden="true"
            >dark_mode</span
          >
        </div>
      </button>
      <div class="theme-transition-overlay" role="presentation"></div>
    `;
  }
}

if (!customElements.get("theme-toggle-button")) {
  customElements.define("theme-toggle-button", ThemeToggleButton);
}
