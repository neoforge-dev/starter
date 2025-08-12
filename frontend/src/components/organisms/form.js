import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";
import { FormValidationMixin } from "../../mixins/form-validation.js";

/**
 * Form component with validation support
 * @element neo-form
 *
 * @fires submit - When form is submitted and validation passes
 * @fires error - When form validation fails
 * @fires reset - When form is reset
 */
export class Form extends FormValidationMixin(LitElement) {
  static properties = {
    loading: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-lg);
      }

      :host([loading]) {
        opacity: 0.7;
        pointer-events: none;
      }

      ::slotted(neo-input) {
        margin-bottom: var(--spacing-md);
      }
    `,
  ];

  constructor() {
    super();
    this.loading = false;
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  async _handleSubmit(e) {
    e.preventDefault();
    this.loading = true;

    try {
      const success = await this.handleSubmit(e);
      if (success) {
        this.dispatchEvent(
          new CustomEvent("submit", {
            detail: { data: this.formState },
            bubbles: true,
            composed: true,
          })
        );
      } else {
        this.dispatchEvent(
          new CustomEvent("error", {
            detail: { errors: this.formErrors },
            bubbles: true,
            composed: true,
          })
        );
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle form reset
   */
  _handleReset() {
    this.resetForm();
    this.dispatchEvent(
      new CustomEvent("reset", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <form
        @submit=${this._handleSubmit}
        @reset=${this._handleReset}
        novalidate
      >
        <slot></slot>
      </form>
    `;
  }
}

customElements.define("neo-form", Form);
