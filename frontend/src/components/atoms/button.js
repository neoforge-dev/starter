import { LitElement, html, css } from "lit";

/**
 * Button component with multiple variants and states
 * @element my-button
 *
 * @prop {string} variant - Button variant (primary, secondary)
 * @prop {boolean} disabled - Disabled state
 * @prop {boolean} loading - Loading state
 */
export class Button extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Variants */
    button.primary {
      background: var(--primary-color, #007bff);
      color: white;
    }

    button.secondary {
      background: var(--secondary-color, #6c757d);
      color: white;
    }

    button:hover:not([disabled]) {
      opacity: 0.9;
    }

    /* Loading state */
    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-radius: 50%;
      border-right-color: transparent;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  constructor() {
    super();
    this.variant = "primary";
    this.disabled = false;
    this.loading = false;
  }

  /**
   * Handle click event
   * @param {Event} e
   */
  _handleClick(e) {
    if (!this.disabled && !this.loading) {
      this.dispatchEvent(
        new CustomEvent("click", {
          bubbles: true,
          composed: true,
          detail: { originalEvent: e },
        })
      );
    }
  }

  render() {
    return html`
      <button
        class=${this.variant}
        ?disabled=${this.disabled || this.loading}
        @click=${this._handleClick}
      >
        ${this.loading
          ? html`<span class="loading-spinner"></span>`
          : html`<slot></slot>`}
      </button>
    `;
  }
}

customElements.define("my-button", Button);
