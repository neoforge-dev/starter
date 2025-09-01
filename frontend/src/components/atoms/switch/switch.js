import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Switch/Toggle component for boolean input
 * @element neo-switch
 *
 * @prop {boolean} checked - Whether the switch is checked/on
 * @prop {boolean} disabled - Whether the switch is disabled
 * @prop {string} label - Label text for the switch
 * @prop {string} onLabel - Custom label for the "on" state
 * @prop {string} offLabel - Custom label for the "off" state
 * @prop {string} size - Size of the switch (sm, md, lg)
 * @prop {string} name - Name attribute for form submission
 * @prop {string} value - Value attribute for form submission
 *
 * @example
 * <neo-switch checked label="Enable notifications"></neo-switch>
 * <neo-switch disabled on-label="On" off-label="Off"></neo-switch>
 */
export class NeoSwitch extends BaseComponent {
  static get properties() {
    return {
      checked: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      label: { type: String },
      onLabel: { type: String, attribute: "on-label" },
      offLabel: { type: String, attribute: "off-label" },
      size: { type: String, reflect: true },
      name: { type: String },
      value: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-block;
          user-select: none;
        }

        :host([disabled]) {
          opacity: 0.6;
          pointer-events: none;
        }

        .switch-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .switch-wrapper.disabled {
          cursor: not-allowed;
        }

        .switch-container {
          position: relative;
          display: inline-block;
        }

        /* Hidden input for form submission and accessibility */
        .switch-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          cursor: inherit;
        }

        /* Switch track */
        .switch-track {
          position: relative;
          background: var(--color-gray-300);
          border-radius: 9999px;
          transition: background-color var(--transition-fast);
          cursor: inherit;
        }

        .switch-track.checked {
          background: var(--color-primary);
        }

        /* Switch thumb */
        .switch-thumb {
          position: absolute;
          top: 2px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform var(--transition-fast);
          cursor: inherit;
        }

        /* Size variants - WCAG AA compliant touch targets */
        .size-sm .switch-track {
          width: 32px;
          height: 18px;
        }

        .size-sm .switch-thumb {
          width: 14px;
          height: 14px;
          left: 2px;
        }

        .size-sm .switch-thumb.checked {
          transform: translateX(14px);
        }

        .size-md .switch-track {
          width: 44px;
          height: 24px;
        }

        .size-md .switch-thumb {
          width: 20px;
          height: 20px;
          left: 2px;
        }

        .size-md .switch-thumb.checked {
          transform: translateX(18px);
        }

        .size-lg .switch-track {
          width: 52px;
          height: 28px;
        }

        .size-lg .switch-thumb {
          width: 24px;
          height: 24px;
          left: 2px;
        }

        .size-lg .switch-thumb.checked {
          transform: translateX(22px);
        }

        /* Label styles */
        .switch-label {
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          color: var(--color-text);
          line-height: 1.4;
          cursor: inherit;
        }

        /* State labels */
        .state-labels {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
        }

        /* Focus styles */
        .switch-input:focus-visible + .switch-track {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Hover effects */
        .switch-wrapper:hover:not(.disabled) .switch-track {
          background: var(--color-gray-400);
        }

        .switch-wrapper:hover:not(.disabled) .switch-track.checked {
          background: var(--color-primary-dark);
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .switch-track {
            border: 2px solid var(--color-text);
          }

          .switch-thumb {
            border: 1px solid var(--color-text);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .switch-track,
          .switch-thumb {
            transition: none;
          }
        }

        /* Error state */
        .switch-wrapper.error .switch-track {
          outline: 2px solid var(--color-error);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.label = "";
    this.onLabel = "";
    this.offLabel = "";
    this.size = "md";
    this.name = "";
    this.value = "";
    this._id = `neo-switch-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle input change
   * @param {Event} e
   */
  _handleChange(e) {
    if (!this.disabled) {
      this.checked = e.target.checked;

      this.dispatchEvent(
        new CustomEvent("neo-change", {
          detail: {
            checked: this.checked,
            name: this.name,
            value: this.value
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Handle click on wrapper (for label clicks)
   * @param {Event} e
   */
  _handleClick(e) {
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    // Only handle clicks that aren't on the input itself
    if (e.target !== this.shadowRoot.querySelector('.switch-input')) {
      const input = this.shadowRoot.querySelector('.switch-input');
      if (input) {
        input.click();
      }
    }
  }

  /**
   * Handle keydown for accessibility
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (this.disabled) return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.checked = !this.checked;
      this._handleChange({ target: { checked: this.checked } });
    }
  }

  render() {
    const wrapperClasses = {
      "switch-wrapper": true,
      [`size-${this.size}`]: true,
      disabled: this.disabled,
      checked: this.checked,
    };

    const trackClasses = {
      "switch-track": true,
      checked: this.checked,
    };

    const thumbClasses = {
      "switch-thumb": true,
      checked: this.checked,
    };

    const currentStateLabel = this.checked ? this.onLabel : this.offLabel;
    const ariaLabel = this.label ||
      (currentStateLabel ? `Switch, ${currentStateLabel}` : "Switch");

    return html`
      <div
        class="${Object.entries(wrapperClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
        @click="${this._handleClick}"
        @keydown="${this._handleKeyDown}"
        role="switch"
        aria-checked="${this.checked}"
        aria-disabled="${this.disabled}"
        aria-label="${ariaLabel}"
        tabindex="${this.disabled ? -1 : 0}"
      >
        <div class="switch-container">
          <input
            type="checkbox"
            class="switch-input"
            id="${this._id}"
            .checked="${this.checked}"
            ?disabled="${this.disabled}"
            name="${this.name}"
            value="${this.value}"
            @change="${this._handleChange}"
            aria-hidden="true"
            tabindex="-1"
          />
          <div
            class="${Object.entries(trackClasses)
              .filter(([, value]) => value)
              .map(([key]) => key)
              .join(" ")}"
          >
            <div
              class="${Object.entries(thumbClasses)
                .filter(([, value]) => value)
                .map(([key]) => key)
                .join(" ")}"
            ></div>
          </div>
        </div>

        ${this.label
          ? html`<span class="switch-label">${this.label}</span>`
          : ""}

        ${this.onLabel || this.offLabel
          ? html`
              <div class="state-labels">
                ${this.offLabel
                  ? html`<span class="${!this.checked ? 'active' : ''}">${this.offLabel}</span>`
                  : ""}
                ${this.onLabel
                  ? html`<span class="${this.checked ? 'active' : ''}">${this.onLabel}</span>`
                  : ""}
              </div>
            `
          : ""}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-switch")) {
  customElements.define("neo-switch", NeoSwitch);
}
