import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("form-validation")
export class FormValidation extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .error-message {
      color: var(--color-error, #dc2626);
      font-size: 0.875rem;
      margin-top: var(--spacing-xs, 0.25rem);
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .validation-icon {
      display: inline-flex;
      align-items: center;
      margin-right: var(--spacing-xs, 0.25rem);
    }

    .validation-list {
      margin-top: var(--spacing-sm, 0.5rem);
      padding-left: var(--spacing-md, 1rem);
    }

    .validation-item {
      display: flex;
      align-items: center;
      margin-bottom: var(--spacing-xs, 0.25rem);
      color: var(--color-text-secondary, #6b7280);
    }

    .validation-item.valid {
      color: var(--color-success, #16a34a);
    }

    .validation-item.invalid {
      color: var(--color-error, #dc2626);
    }
  `;

  @property({ type: String }) value = "";
  @property({ type: Array }) rules = [];
  @property({ type: Boolean }) showValidation = false;

  @state() validationResults = [];
  @state() isValid = false;

  updated(changedProperties) {
    if (changedProperties.has("value") || changedProperties.has("rules")) {
      this._validateValue();
    }
  }

  _validateValue() {
    if (!this.rules || !this.rules.length) {
      this.isValid = true;
      this.validationResults = [];
      return;
    }

    this.validationResults = this.rules.map((rule) => {
      const isValid = rule.test(this.value);
      return {
        message: rule.message,
        isValid,
      };
    });

    this.isValid = this.validationResults.every((result) => result.isValid);
    this._dispatchValidation();
  }

  _dispatchValidation() {
    this.dispatchEvent(
      new CustomEvent("validation", {
        detail: {
          isValid: this.isValid,
          results: this.validationResults,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.showValidation || !this.validationResults.length) {
      return html`<slot></slot>`;
    }

    return html`
      <slot></slot>
      <div class="validation-list">
        ${this.validationResults.map(
          (result) => html`
            <div
              class="validation-item ${result.isValid ? "valid" : "invalid"}"
            >
              <span class="validation-icon">
                ${result.isValid ? "✓" : "✗"}
              </span>
              <span>${result.message}</span>
            </div>
          `
        )}
      </div>
    `;
  }
}
