import { LitElement, html } from '/vendor/lit-core.min.js';
import { baseStyles } from '../../styles/base.js';

export class ThemeProvider extends LitElement {
  static properties = {
    theme: { type: String, reflect: true },
  };

  static styles = [baseStyles];

  constructor() {
    super();
    this.theme = this._getInitialTheme();
    this._handleSystemThemeChange = this._handleSystemThemeChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addListener(this._handleSystemThemeChange);
    // Dispatch initial theme
    this._dispatchTheme();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.matchMedia('(prefers-color-scheme: dark)').removeListener(this._handleSystemThemeChange);
  }

  render() {
    return html`
      <div class="theme-provider" data-theme="${this.theme}">
        <slot></slot>
      </div>
    `;
  }

  _getInitialTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem('neo-theme');
    if (savedTheme) return savedTheme;

    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  _handleSystemThemeChange(e) {
    if (!localStorage.getItem('neo-theme')) {
      this.theme = e.matches ? 'dark' : 'light';
      this._dispatchTheme();
    }
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    localStorage.setItem('neo-theme', newTheme);
    this._dispatchTheme();
  }

  _dispatchTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.dispatchEvent(new CustomEvent('theme-changed', {
      bubbles: true,
      composed: true,
      detail: { theme: this.theme }
    }));
  }
}

customElements.define('neo-theme-provider', ThemeProvider); 