import { html } from "lit";

/**
 * Mixin that provides a simple form validation system.
 * Use this mixin in your form components to handle field validation.
 */
export const FormValidationMixin = (superClass) =>
  class extends superClass {
    static properties = {
      ...superClass.properties,
      formErrors: { type: Object, state: true },
    };

    constructor() {
      super();
      this.formErrors = {};
    }

    /**
     * Validate a single field based on provided rules.
     * @param {string} field - Field name.
     * @param {string} value - Field value.
     * @param {object} rules - Validation rules (e.g. { required: true, email: true, minLength: 3 }).
     * @returns {string} The error message (if any).
     */
    validateField(field, value, rules = {}) {
      let error = "";
      if (rules.required && (!value || value.trim() === "")) {
        error = "This field is required.";
      }
      if (!error && rules.email) {
        // Basic email validation pattern.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = "Please enter a valid email address.";
        }
      }
      if (!error && rules.minLength && value.length < rules.minLength) {
        error = `Minimum length is ${rules.minLength} characters.`;
      }
      if (!error && rules.maxLength && value.length > rules.maxLength) {
        error = `Maximum length is ${rules.maxLength} characters.`;
      }
      this.formErrors[field] = error;
      this.requestUpdate();
      return error;
    }

    /**
     * Validate a form by iterating through each field.
     * @param {FormData} formData - Data from the submitted form.
     * @param {object} rules - Object containing validation rules for each field.
     * @returns {object} An object with error messages for each field.
     */
    validateForm(formData, rules) {
      const errors = {};
      Object.keys(rules).forEach((field) => {
        errors[field] = this.validateField(
          field,
          formData.get(field),
          rules[field]
        );
      });
      this.formErrors = errors;
      return errors;
    }

    /**
     * Render error message for a given field.
     * @param {string} field - Field name.
     * @returns {import('lit').TemplateResult|null}
     */
    renderError(field) {
      if (this.formErrors[field]) {
        return html`<div class="error-message">${this.formErrors[field]}</div>`;
      }
      return null;
    }
  };
