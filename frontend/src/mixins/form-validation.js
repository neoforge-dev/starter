import { html } from "lit";

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
    };

    constructor() {
      super();
      this.formState = {};
      this.formErrors = {};
      this.formTouched = {};
      this.isSubmitting = false;
      this.isValid = true;
      this._validators = new Map();
      this._asyncValidators = new Map();
    }

    /**
     * Add a synchronous validator
     * @param {string} fieldName - Field name
     * @param {Function} validator - Validator function
     */
    addValidator(fieldName, validator) {
      if (!this._validators.has(fieldName)) {
        this._validators.set(fieldName, []);
      }
      this._validators.get(fieldName).push(validator);
    }

    /**
     * Add an asynchronous validator
     * @param {string} fieldName - Field name
     * @param {Function} validator - Async validator function
     */
    addAsyncValidator(fieldName, validator) {
      if (!this._asyncValidators.has(fieldName)) {
        this._asyncValidators.set(fieldName, []);
      }
      this._asyncValidators.get(fieldName).push(validator);
    }

    /**
     * Handle form input changes
     * @param {Event} e - Input event
     */
    handleInput(e) {
      const { name, value } = e.target;
      this.setFieldValue(name, value);
    }

    /**
     * Set a field value and validate
     * @param {string} name - Field name
     * @param {any} value - Field value
     */
    setFieldValue(name, value) {
      this.formState = {
        ...this.formState,
        [name]: value,
      };
      this.validateField(name);
    }

    /**
     * Mark a field as touched
     * @param {string} name - Field name
     */
    setFieldTouched(name) {
      this.formTouched = {
        ...this.formTouched,
        [name]: true,
      };
      this.validateField(name);
    }

    /**
     * Reset form state
     */
    resetForm() {
      this.formState = {};
      this.formErrors = {};
      this.formTouched = {};
      this.isSubmitting = false;
      this.isValid = true;
    }

    /**
     * Validate a specific field
     * @param {string} name - Field name
     */
    async validateField(name) {
      const value = this.formState[name];
      let errors = [];

      // Run synchronous validators
      if (this._validators.has(name)) {
        for (const validator of this._validators.get(name)) {
          const error = validator(value, this.formState);
          if (error) errors.push(error);
        }
      }

      // Run async validators
      if (this._asyncValidators.has(name)) {
        const asyncResults = await Promise.all(
          this._asyncValidators
            .get(name)
            .map((validator) => validator(value, this.formState))
        );
        errors = [...errors, ...asyncResults.filter(Boolean)];
      }

      this.formErrors = {
        ...this.formErrors,
        [name]: errors.length ? errors : null,
      };

      this.isValid = Object.values(this.formErrors).every(
        (error) => !error || error.length === 0
      );

      return errors.length === 0;
    }

    /**
     * Validate all form fields
     */
    async validateForm() {
      const fieldNames = [
        ...new Set([
          ...Object.keys(this.formState),
          ...this._validators.keys(),
          ...this._asyncValidators.keys(),
        ]),
      ];

      const results = await Promise.all(
        fieldNames.map((name) => this.validateField(name))
      );

      return results.every(Boolean);
    }

    /**
     * Handle form submission
     * @param {Event} e - Submit event
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
          return false;
        }

        if (this.onSubmit) {
          await this.onSubmit(this.formState);
        }
        return true;
      } finally {
        this.isSubmitting = false;
      }
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
