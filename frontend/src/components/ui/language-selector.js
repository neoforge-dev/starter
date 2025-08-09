import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class LanguageSelector extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .language-selector {
      position: relative;
      user-select: none;
    }

    .selected-language {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      cursor: pointer;
      background: var(--color-surface, #fff);
      transition: border-color 0.3s ease;
    }

    .selected-language:hover {
      border-color: var(--color-primary, #007bff);
    }

    .flag {
      width: 20px;
      height: 15px;
      margin-right: 0.5rem;
      object-fit: cover;
      border-radius: 2px;
    }

    .language-name {
      margin-right: 0.5rem;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.25rem;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      opacity: 0;
      transform: translateY(-10px);
      pointer-events: none;
      transition:
        opacity 0.3s ease,
        transform 0.3s ease;
      z-index: 1000;
    }

    .dropdown.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .language-option {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .language-option:hover {
      background-color: var(--color-surface-2, #f5f5f5);
    }

    .chevron {
      margin-left: auto;
      width: 12px;
      height: 12px;
      transition: transform 0.3s ease;
    }

    .chevron.open {
      transform: rotate(180deg);
    }
  `;

  static properties = {
    languages: { type: Array },
    selected: { type: String },
    isOpen: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.languages = [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "es", name: "Español", flag: "🇪🇸" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
      { code: "de", name: "Deutsch", flag: "🇩🇪" },
    ];
    this.selected = "en";
    this.isOpen = false;
    this._handleClickOutside = this._handleClickOutside.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleClickOutside);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleClickOutside);
  }

  render() {
    const selectedLanguage = this.languages.find(
      (lang) => lang.code === this.selected
    );

    return html`
      <div class="language-selector">
        <div class="selected-language" @click=${this._toggleDropdown}>
          <span class="flag">${selectedLanguage.flag}</span>
          <span class="language-name">${selectedLanguage.name}</span>
          <svg class="chevron ${this.isOpen ? "open" : ""}" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="dropdown ${this.isOpen ? "open" : ""}">
          ${this.languages.map(
            (language) => html`
              <div
                class="language-option"
                @click=${() => this._selectLanguage(language.code)}
                ?selected=${language.code === this.selected}
              >
                <span class="flag">${language.flag}</span>
                <span class="language-name">${language.name}</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  _toggleDropdown(e) {
    e.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  _selectLanguage(code) {
    if (code !== this.selected) {
      this.selected = code;
      this.isOpen = false;
      this.dispatchEvent(
        new CustomEvent("language-change", {
          detail: { language: code },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _handleClickOutside(e) {
    if (!this.shadowRoot.contains(e.target)) {
      this.isOpen = false;
    }
  }
}

customElements.define("language-selector", LanguageSelector);
