import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("language-selector")
export class LanguageSelector extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .language-select {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 0.5rem);
      padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .language-select:hover {
      border-color: var(--color-primary, #3b82f6);
    }

    .language-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.375rem);
      margin-top: var(--spacing-xs, 0.25rem);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 100;
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: all 0.2s ease;
    }

    .language-menu.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .language-option {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 0.5rem);
      padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .language-option:hover {
      background: var(--color-surface-hover, #f5f5f5);
    }

    .language-option.selected {
      background: var(--color-primary-light, #eff6ff);
      color: var(--color-primary, #3b82f6);
    }

    .flag {
      width: 20px;
      height: 15px;
      object-fit: cover;
      border-radius: 2px;
    }
  `;

  @property({ type: Array }) languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
  ];

  @property({ type: String }) selected = "en";
  @state() isOpen = false;

  constructor() {
    super();
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

  _handleClickOutside(event) {
    if (!this.contains(event.target)) {
      this.isOpen = false;
    }
  }

  _toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  _selectLanguage(code) {
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

  render() {
    const selectedLanguage = this.languages.find(
      (lang) => lang.code === this.selected
    );

    return html`
      <div class="language-selector">
        <div class="language-select" @click=${this._toggleMenu}>
          <span class="flag">${selectedLanguage?.flag}</span>
          <span>${selectedLanguage?.name}</span>
          <span>${this.isOpen ? "▲" : "▼"}</span>
        </div>
        <div class="language-menu ${this.isOpen ? "open" : ""}">
          ${this.languages.map(
            (lang) => html`
              <div
                class="language-option ${lang.code === this.selected
                  ? "selected"
                  : ""}"
                @click=${() => this._selectLanguage(lang.code)}
              >
                <span class="flag">${lang.flag}</span>
                <span>${lang.name}</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}
