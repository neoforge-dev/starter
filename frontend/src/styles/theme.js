/**
 * theme.js
 *
 * This file exports useful theme-related constants and mixins.
 *
 * - themeVariables: Contains key-value pairs for theme colors and settings.
 * - ThemeToggleMixin: A mixin for LitElement-based components to add a theme toggling feature.
 */

import { css } from "lit";
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

// Define theme variables for dynamic theming; these can be used in CSS-in-JS or runtime logic
export const themeVariables = {
  primaryColor: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#60a5fa",
  secondaryColor: "#4f46e5",
  accentColor: "#0ea5e9",
  successColor: "#059669",
  warningColor: "#d97706",
  errorColor: "#dc2626",
  backgroundColor: "#ffffff",
  surfaceColor: "#f8fafc",
  borderColor: "#e2e8f0",
  // You can extend this object with additional variables
};

// ThemeToggleMixin adds a 'theme' property and a 'toggleTheme' method to a LitElement-based component
export const ThemeToggleMixin = (superClass) =>
  class extends superClass {
    static get properties() {
      return {
        darkMode: { type: Boolean, reflect: true },
      };
    }

    constructor() {
      super();
      this.darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      this._handleSystemThemeChange = this._handleSystemThemeChange.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", this._handleSystemThemeChange);
      this._updateTheme();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", this._handleSystemThemeChange);
    }

    _handleSystemThemeChange(e) {
      this.darkMode = e.matches;
      this._updateTheme();
    }

    toggleTheme() {
      this.darkMode = !this.darkMode;
      this._updateTheme();
    }

    _updateTheme() {
      document.documentElement.setAttribute(
        "data-theme",
        this.darkMode ? "dark" : "light"
      );
      localStorage.setItem("theme", this.darkMode ? "dark" : "light");
    }
  };

export const ThemeToggle = dedupeMixin(ThemeToggleMixin);

// Apply theme variables to document root
function applyTheme(theme) {
  const root = document.documentElement;
  const config = theme === "light" ? themeConfig.light : themeConfig.dark;

  // Colors
  root.style.setProperty("--primary-color", config.primary);
  root.style.setProperty("--secondary-color", config.secondary);
  root.style.setProperty("--accent-color", config.accent);
  root.style.setProperty("--success-color", config.success);
  root.style.setProperty("--warning-color", config.warning);
  root.style.setProperty("--error-color", config.error);
  root.style.setProperty("--background-color", config.background);
  root.style.setProperty("--surface-color", config.surface);
  root.style.setProperty("--border-color", config.border);

  // Text colors
  root.style.setProperty("--text-color", config.text.primary);
  root.style.setProperty("--text-secondary", config.text.secondary);
  root.style.setProperty("--text-tertiary", config.text.tertiary);

  // Code colors
  root.style.setProperty("--code-background", config.code.background);
  root.style.setProperty("--code-text", config.code.text);
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
