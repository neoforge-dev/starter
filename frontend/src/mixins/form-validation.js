import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { AppError, ErrorType } from "../services/error-service.js";

/**
 * Form validation rules
 * @typedef {Object} ValidationRule
 * @property {Function} validate - Validation function
 * @property {string} message - Error message
 */

/**
 * Form validation mixin for Lit components
 * Provides form validation functionality and state management
 */
export const FormValidationMixin = (superClass) =>
  class extends superClass {
    static properties = {
      ...superClass.properties,
      formState: { type: Object, state: true },
      formErrors: { type: Object, state: true },
      formTouched: { type: Object, state: true },
      isSubmitting: { type: Boolean, state: true },
      isValid: { type: Boolean, state: true },
      validationRules: { type: Object },
      validateOnChange: { type: Boolean },
      validateOnBlur: { type: Boolean },
    };

    constructor() {
      super();
      this.formState = {};
      this.formErrors = {};
      this.formTouched = {};
      this.isSubmitting = false;
      this.isValid = true;
      this.validationRules = {};
      this.validateOnChange = true;
      this.validateOnBlur = true;
    }

    /**
     * Default validation rules
     * @protected
     */
    get defaultRules() {
      return {
        required: {
          validate: (value) =>
            value !== undefined && value !== null && value !== "",
          message: "This field is required",
        },
        email: {
          validate: (value) =>
            !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message: "Please enter a valid email address",
        },
        minLength: {
          validate: (value, min) => !value || value.length >= min,
          message: (min) => `Must be at least ${min} characters`,
        },
        maxLength: {
          validate: (value, max) => !value || value.length <= max,
          message: (max) => `Must be no more than ${max} characters`,
        },
        pattern: {
          validate: (value, pattern) => !value || pattern.test(value),
          message: "Please enter a valid value",
        },
        match: {
          validate: (value, field) => !value || value === this.formState[field],
          message: (field) => `Must match ${field}`,
        },
      };
    }

    /**
     * Initialize form state
     * @param {Object} initialState - Initial form state
     * @protected
     */
    initForm(initialState = {}) {
      this.formState = { ...initialState };
      this.formErrors = {};
      this.formTouched = {};
      this.isSubmitting = false;
    }

    /**
     * Reset form to initial state
     * @protected
     */
    resetForm() {
      this.initForm();
      this.requestUpdate();
    }

    /**
     * Handle field change
     * @param {Event} e - Change event
     * @protected
     */
    async handleFieldChange(e) {
      const field = e.target.name;
      const value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

      this.formState = {
        ...this.formState,
        [field]: value,
      };

      if (this.validateOnChange) {
        await this.validateField(field);
      }

      this.requestUpdate();
    }

    /**
     * Handle field blur
     * @param {Event} e - Blur event
     * @protected
     */
    async handleFieldBlur(e) {
      const field = e.target.name;

      this.formTouched = {
        ...this.formTouched,
        [field]: true,
      };

      if (this.validateOnBlur) {
        await this.validateField(field);
      }

      this.requestUpdate();
    }

    /**
     * Validate a single field
     * @param {string} field - Field name
     * @returns {Promise<boolean>}
     * @protected
     */
    async validateField(field) {
      const value = this.formState[field];
      const rules = this.validationRules[field] || {};

      try {
        for (const [ruleName, ruleConfig] of Object.entries(rules)) {
          const rule = this.defaultRules[ruleName];
          if (!rule) continue;

          const isValid = await rule.validate(value, ruleConfig.value);
          if (!isValid) {
            const message =
              typeof rule.message === "function"
                ? rule.message(ruleConfig.value)
                : ruleConfig.message || rule.message;

            throw new AppError(message, ErrorType.VALIDATION, {
              field,
              rule: ruleName,
              value,
            });
          }
        }

        // Clear error if validation passes
        this.formErrors = {
          ...this.formErrors,
          [field]: undefined,
        };

        return true;
      } catch (error) {
        // Set validation error
        this.formErrors = {
          ...this.formErrors,
          [field]: error.message,
        };

        return false;
      }
    }

    /**
     * Validate entire form
     * @returns {Promise<boolean>}
     * @protected
     */
    async validateForm() {
      const validations = Object.keys(this.validationRules).map((field) =>
        this.validateField(field)
      );

      const results = await Promise.all(validations);
      return results.every(Boolean);
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     * @protected
     */
    async handleSubmit(e) {
      e.preventDefault();
      this.isSubmitting = true;

      try {
        const isValid = await this.validateForm();
        if (!isValid) {
          // Mark all fields as touched to show errors
          const touchedState = Object.keys(this.formState).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {}
          );
          this.formTouched = touchedState;

          throw new AppError(
            "Please fix the validation errors",
            ErrorType.VALIDATION,
            {
              errors: this.formErrors,
            }
          );
        }

        if (this.onSubmit) {
          await this.onSubmit(this.formState);
        }

        return true;
      } catch (error) {
        if (!(error instanceof AppError)) {
          throw new AppError("Form submission failed", ErrorType.UNKNOWN, {
            originalError: error,
          });
        }
        throw error;
      } finally {
        this.isSubmitting = false;
      }
    }

    /**
     * Render error message for a field
     * @param {string} field - Field name
     * @returns {import('lit').TemplateResult|null}
     * @protected
     */
    renderError(field) {
      if (
        this.formErrors[field] &&
        (this.formTouched[field] || this.isSubmitting)
      ) {
        return html`
          <div class="error-message" role="alert">
            ${this.formErrors[field]}
          </div>
        `;
      }
      return null;
    }
  };

// Common validators
export const validators = {
  required:
    (message = "This field is required") =>
    (value) =>
      !value ? message : null,

  email:
    (message = "Please enter a valid email address") =>
    (value) =>
      value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : null,

  minLength: (length, message) => (value) =>
    value && value.length < length
      ? message || `Minimum length is ${length} characters`
      : null,

  maxLength: (length, message) => (value) =>
    value && value.length > length
      ? message || `Maximum length is ${length} characters`
      : null,

  pattern:
    (regex, message = "Please enter a valid value") =>
    (value) =>
      value && !regex.test(value) ? message : null,

  match:
    (fieldName, message = "Fields do not match") =>
    (value, formState) =>
      value !== formState[fieldName] ? message : null,
};
