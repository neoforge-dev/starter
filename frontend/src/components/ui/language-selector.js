import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { i18n } from "../../services/i18n.js";

export class LanguageSelector extends LitElement {
  static properties = {
    currentLocale: { type: String },
    supportedLocales: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
      }

      .language-select {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--surface-color);
        color: var(--text-color);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .language-select:hover {
        border-color: var(--primary-color);
      }

      .language-select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
      }
    `,
  ];

  constructor() {
    super();
    this.currentLocale = i18n.getCurrentLocale();
    this.supportedLocales = i18n.getSupportedLocales();
  }

  render() {
    return html`
      <select
        class="language-select"
        .value=${this.currentLocale}
        @change=${this._handleLanguageChange}
      >
        ${this.supportedLocales.map(
          (locale) => html`
            <option value=${locale}>${this._getLanguageName(locale)}</option>
          `
        )}
      </select>
    `;
  }

  _handleLanguageChange(e) {
    const newLocale = e.target.value;
    i18n.setLocale(newLocale);
  }

  _getLanguageName(locale) {
    return new Intl.DisplayNames([locale], { type: "language" }).of(locale);
  }
}

customElements.define("language-selector", LanguageSelector);
