import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class LanguageSelector extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }

    .selected-language {
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

    .selected-language:hover {
      border-color: var(--color-primary, #3b82f6);
    }

    .dropdown {
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

    .dropdown.open {
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

    .language-option:focus {
      outline: 2px solid var(--color-primary, #3b82f6);
      background: var(--color-surface-hover, #f5f5f5);
    }

    .flag {
      width: 20px;
      height: 15px;
      object-fit: cover;
      border-radius: 2px;
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
      { code: "en", name: "English" },
      { code: "es", name: "Español" },
      { code: "fr", name: "Français" },
    ];
    this.selected = "en";
    this.isOpen = false;
    this._handleClickOutside = this._handleClickOutside.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleClickOutside);
    this.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleClickOutside);
    this.removeEventListener("keydown", this._handleKeyDown);
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
        detail: { code: code },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleKeyDown(event) {
    if (!this.isOpen) {
      if (event.key === "Enter" || event.key === " ") {
        this._toggleMenu();
        event.preventDefault();
      }
      return;
    }

    const options = Array.from(
      this.shadowRoot.querySelectorAll(".language-option")
    );
    const currentIndex = options.findIndex(
      (option) => option === this.shadowRoot.activeElement
    );

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (currentIndex < 0) {
          if (options.length > 1) {
            options[1].focus();
          } else {
            options[0].focus();
          }
        } else if (currentIndex >= options.length - 1) {
          options[0].focus();
        } else {
          options[currentIndex + 1].focus();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (currentIndex === 1) {
          options[options.length - 1].focus();
        } else if (currentIndex < 0 || currentIndex === 0) {
          options[options.length - 1].focus();
        } else {
          options[currentIndex - 1].focus();
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (
          this.shadowRoot.activeElement &&
          this.shadowRoot.activeElement.hasAttribute("data-code")
        ) {
          const code = this.shadowRoot.activeElement.getAttribute("data-code");
          this._selectLanguage(code);
        }
        break;
      case "Escape":
        event.preventDefault();
        this.isOpen = false;
        break;
    }
  }

  render() {
    const selectedLanguage = this.languages.find(
      (lang) => lang.code === this.selected
    );

    return html`
      <div class="selected-language" @click=${this._toggleMenu}>
        <span>${selectedLanguage?.name}</span>
        <span>${this.isOpen ? "▲" : "▼"}</span>
      </div>
      <div class="dropdown ${this.isOpen ? "open" : ""}">
        ${this.languages.map(
          (lang) => html`
            <div
              class="language-option ${lang.code === this.selected
                ? "selected"
                : ""}"
              @click=${() => this._selectLanguage(lang.code)}
              data-code="${lang.code}"
              tabindex="${this.isOpen ? "0" : "-1"}"
            >
              <span>${lang.name}</span>
            </div>
          `
        )}
      </div>
    `;
  }
}

customElements.define("language-selector", LanguageSelector);
