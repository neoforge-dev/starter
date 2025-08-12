import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";

/**
 * Language selector component
 * @element neo-language-selector
 */
export class NeoLanguageSelector extends LitElement {
  static properties = {
    languages: { type: Array },
    currentLanguage: { type: String, attribute: "current-language" },
    displayFormat: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      select {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--surface-color);
        color: var(--text-color);
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      select:hover {
        border-color: var(--primary-color);
      }

      select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
      }

      .language-option {
        padding: var(--spacing-sm);
      }

      .language-option.active {
        background: var(--primary-light);
        color: var(--primary-color);
      }
    `,
  ];

  constructor() {
    super();
    this.languages = [];
    this.currentLanguage = "en";
    this.displayFormat = "full";
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  _handleKeyDown(e) {
    const select = this.shadowRoot.querySelector("select");
    if (document.activeElement === select) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const currentIndex = this.languages.findIndex(
          (lang) => lang.code === this.currentLanguage
        );
        const nextIndex =
          e.key === "ArrowDown"
            ? (currentIndex + 1) % this.languages.length
            : (currentIndex - 1 + this.languages.length) %
              this.languages.length;

        this.currentLanguage = this.languages[nextIndex].code;
        this.dispatchEvent(
          new CustomEvent("language-change", {
            detail: { language: this.currentLanguage },
          })
        );
        e.preventDefault();
      }
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("currentLanguage")) {
      localStorage.setItem("preferred-language", this.currentLanguage);
      if (!this.languages.find((lang) => lang.code === this.currentLanguage)) {
        this.currentLanguage = "en";
      }
    }
  }

  _handleLanguageChange(e) {
    const newLang = e.target.value;
    this.currentLanguage = newLang;
    this.dispatchEvent(
      new CustomEvent("language-change", {
        detail: { language: newLang },
      })
    );
  }

  _formatLanguage(lang) {
    if (this.displayFormat === "code") {
      return lang.code.toUpperCase();
    }
    return lang.name;
  }

  render() {
    return html`
      <div class="language-selector">
        <select
          .value=${this.currentLanguage}
          @change=${this._handleLanguageChange}
          aria-label="Select language"
          role="combobox"
        >
          ${this.languages.map(
            (lang) => html`
              <option
                value=${lang.code}
                ?selected=${lang.code === this.currentLanguage}
                class="language-option ${lang.code === this.currentLanguage
                  ? "active"
                  : ""}"
                data-lang=${lang.code}
              >
                ${this._formatLanguage(lang)}
              </option>
            `
          )}
        </select>
      </div>
    `;
  }
}

customElements.define("neo-language-selector", NeoLanguageSelector);
