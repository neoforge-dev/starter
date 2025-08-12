/**
 * theme.js
 *
 * This file exports useful theme-related constants and mixins.
 *
 * - themeVariables: Contains key-value pairs for theme colors and settings.
 * - ThemeToggleMixin: A mixin for LitElement-based components to add a theme toggling feature.
 */

// CSS utilities not needed in this theme configuration file
import { dedupeMixin } from "../utils/dedupeMixin.js";

// Theme configuration object
export const themeConfig = {
  light: {
    primary: "#2563eb", // Modern blue
    secondary: "#4f46e5", // Deep indigo
    accent: "#0ea5e9", // Sky blue
    success: "#059669", // Emerald
    warning: "#d97706", // Amber
    error: "#dc2626", // Red
    background: "#ffffff",
    surface: "#f8fafc",
    border: "#e2e8f0",
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      tertiary: "#94a3b8",
    },
    code: {
      background: "#1e293b",
      text: "#e2e8f0",
    },
  },
  dark: {
    primary: "#3b82f6", // Bright blue
    secondary: "#6366f1", // Bright indigo
    accent: "#38bdf8", // Bright sky
    success: "#10b981", // Bright emerald
    warning: "#f59e0b", // Bright amber
    error: "#ef4444", // Bright red
    background: "#0f172a",
    surface: "#1e293b",
    border: "#334155",
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
      tertiary: "#64748b",
    },
    code: {
      background: "#0f172a",
      text: "#f8fafc",
    },
  },
};

// Theme variables are now centralized in global.css
// Use CSS custom properties for runtime theming: var(--primary-color), etc.

// ThemeToggleMixin adds a 'theme' property and a 'toggleTheme' method to a LitElement-based component
export const ThemeToggleMixin = (superClass) =>
  class extends superClass {
    static get properties() {
      return {
        darkMode: { type: Boolean, reflect: true },
        theme: { type: String, reflect: true },
      };
    }

    constructor() {
      super();
      this.theme = "light";
      this.darkMode = false;

      // Check for system preference
      try {
        const prefersDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        this.darkMode = prefersDark;
        this.theme = prefersDark ? "dark" : "light";

        // Check for saved theme
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
          this.theme = savedTheme;
          this.darkMode = savedTheme === "dark";
        }
      } catch (e) {
        console.warn("Error initializing theme:", e);
      }

      this._handleSystemThemeChange = this._handleSystemThemeChange.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      try {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        // Support both modern and legacy event listeners
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener("change", this._handleSystemThemeChange);
        } else if (mediaQuery.addListener) {
          mediaQuery.addListener(this._handleSystemThemeChange);
        }

        // Initialize theme on first connect
        this._updateTheme();
      } catch (e) {
        console.warn("Error setting up theme listeners:", e);
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      try {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        // Support both modern and legacy event listeners
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener(
            "change",
            this._handleSystemThemeChange
          );
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(this._handleSystemThemeChange);
        }
      } catch (e) {
        console.warn("Error removing theme listeners:", e);
      }
    }

    _handleSystemThemeChange(e) {
      this.darkMode = e.matches;
      this.theme = e.matches ? "dark" : "light";
      this._updateTheme();
    }

    toggleTheme() {
      this.darkMode = !this.darkMode;
      this.theme = this.darkMode ? "dark" : "light";
      this._updateTheme();

      // Dispatch event for other components
      this.dispatchEvent(
        new CustomEvent("theme-changed", {
          detail: { theme: this.theme },
          bubbles: true,
          composed: true,
        })
      );
    }

    _updateTheme() {
      try {
        document.documentElement.setAttribute("data-theme", this.theme);
        localStorage.setItem("theme", this.theme);
      } catch (e) {
        console.warn("Error updating theme:", e);
      }
    }
  };

export const ThemeToggle = dedupeMixin(ThemeToggleMixin);

// Apply theme variables to document root
export function applyTheme(theme) {
  const root = document.documentElement;
  if (!root || !root.style) {
    console.warn("Document root not available for theme application");
    return;
  }

  const config = theme === "dark" ? themeConfig.dark : themeConfig.light;

  // Safely set properties
  const setProperty = (key, value) => {
    try {
      root.style.setProperty(key, value);
    } catch (e) {
      console.warn(`Failed to set CSS property ${key}:`, e);
    }
  };

  // Colors
  setProperty("--primary-color", config.primary);
  setProperty("--secondary-color", config.secondary);
  setProperty("--accent-color", config.accent);
  setProperty("--success-color", config.success);
  setProperty("--warning-color", config.warning);
  setProperty("--error-color", config.error);
  setProperty("--background-color", config.background);
  setProperty("--surface-color", config.surface);
  setProperty("--border-color", config.border);

  // Text colors
  setProperty("--text-primary-color", config.text.primary);
  setProperty("--text-secondary-color", config.text.secondary);
  setProperty("--text-tertiary-color", config.text.tertiary);

  // Code colors
  setProperty("--code-background-color", config.code.background);
  setProperty("--code-text-color", config.code.text);

  // Update data-theme attribute
  try {
    root.dataset.theme = theme;
  } catch (e) {
    console.warn("Failed to update theme attribute:", e);
  }
}

// Initialize theme
const savedTheme = localStorage.getItem("theme") || "system";
const systemTheme =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
const initialTheme = savedTheme === "system" ? systemTheme : savedTheme;

applyTheme(initialTheme);
document.documentElement.setAttribute("data-theme", initialTheme);
