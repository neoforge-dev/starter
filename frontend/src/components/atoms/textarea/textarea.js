import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * TextArea component for multi-line text input
 * @element neo-textarea
 *
 * @prop {string} value - The current value of the textarea
 * @prop {string} placeholder - Placeholder text
 * @prop {string} label - Label text for the textarea
 * @prop {string} name - Name attribute for forms
 * @prop {number} rows - Number of visible rows (default: 4)
 * @prop {number} maxlength - Maximum number of characters allowed
 * @prop {number} minlength - Minimum number of characters required
 * @prop {boolean} disabled - Whether the textarea is disabled
 * @prop {boolean} readonly - Whether the textarea is read-only
 * @prop {boolean} required - Whether the textarea is required
 * @prop {boolean} autoResize - Whether to automatically resize based on content
 * @prop {string} resize - CSS resize property (none, both, horizontal, vertical)
 * @prop {string} size - Size variant (sm, md, lg)
 * @prop {string} variant - Visual variant (default, success, error, warning)
 * @prop {string} helperText - Helper text displayed below the textarea
 * @prop {string} errorText - Error text displayed when validation fails
 * @prop {boolean} showCounter - Whether to show character counter
 * @prop {string} autocomplete - Autocomplete attribute
 * @prop {string} spellcheck - Spellcheck attribute
 * 
 * @event input - Fired when the value changes
 * @event change - Fired when the textarea loses focus and value changed
 * @event focus - Fired when the textarea gains focus
 * @event blur - Fired when the textarea loses focus
 */
export class NeoTextArea extends BaseComponent {
  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String },
      label: { type: String },
      name: { type: String },
      rows: { type: Number },
      maxlength: { type: Number },
      minlength: { type: Number },
      disabled: { type: Boolean, reflect: true },
      readonly: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
      autoResize: { type: Boolean },
      resize: { type: String },
      size: { type: String, reflect: true },
      variant: { type: String, reflect: true },
      helperText: { type: String },
      errorText: { type: String },
      showCounter: { type: Boolean },
      autocomplete: { type: String },
      spellcheck: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          width: 100%;
        }

        :host([disabled]) {
          opacity: 0.5;
          pointer-events: none;
        }

        .textarea-container {
          position: relative;
          width: 100%;
        }

        .label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
        }

        .label.required::after {
          content: " *";
          color: var(--color-error);
        }

        .textarea-wrapper {
          position: relative;
          display: flex;
          width: 100%;
        }

        textarea {
          width: 100%;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          color: var(--color-text);
          background-color: var(--color-surface);
          transition: all var(--transition-fast);
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        }

        textarea::placeholder {
          color: var(--color-text-muted);
          opacity: 1;
        }

        /* Sizes */
        .size-sm textarea {
          padding: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }

        .size-md textarea {
          padding: var(--spacing-md);
          font-size: var(--font-size-base);
        }

        .size-lg textarea {
          padding: var(--spacing-lg);
          font-size: var(--font-size-lg);
        }

        /* Variants */
        .variant-default textarea {
          border-color: var(--color-border);
        }

        .variant-success textarea {
          border-color: var(--color-success);
        }

        .variant-error textarea {
          border-color: var(--color-error);
        }

        .variant-warning textarea {
          border-color: var(--color-warning);
        }

        /* States */
        textarea:hover:not(:disabled):not(:focus) {
          border-color: var(--color-border-hover);
        }

        textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .variant-success textarea:focus {
          border-color: var(--color-success);
          box-shadow: 0 0 0 3px var(--color-success-light);
        }

        .variant-error textarea:focus {
          border-color: var(--color-error);
          box-shadow: 0 0 0 3px var(--color-error-light);
        }

        .variant-warning textarea:focus {
          border-color: var(--color-warning);
          box-shadow: 0 0 0 3px var(--color-warning-light);
        }

        textarea:disabled {
          background-color: var(--color-surface-variant);
          border-color: var(--color-border-disabled);
          color: var(--color-text-disabled);
          cursor: not-allowed;
        }

        textarea:read-only {
          background-color: var(--color-surface-variant);
          cursor: default;
        }

        /* Resize options */
        .resize-none textarea {
          resize: none;
        }

        .resize-both textarea {
          resize: both;
        }

        .resize-horizontal textarea {
          resize: horizontal;
        }

        .resize-vertical textarea {
          resize: vertical;
        }

        /* Helper and error text */
        .helper-text,
        .error-text {
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          line-height: 1.4;
        }

        .helper-text {
          color: var(--color-text-secondary);
        }

        .error-text {
          color: var(--color-error);
        }

        /* Character counter */
        .counter {
          position: absolute;
          bottom: var(--spacing-xs);
          right: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          background: var(--color-surface);
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          pointer-events: none;
        }

        .counter.over-limit {
          color: var(--color-error);
        }

        /* Auto-resize specific styles */
        .auto-resize textarea {
          resize: none;
          overflow-y: hidden;
        }

        /* Focus within container for styling */
        .textarea-wrapper:focus-within {
          /* Used for any wrapper-specific focus styles if needed */
        }

        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.value = "";
    this.placeholder = "";
    this.label = "";
    this.name = "";
    this.rows = 4;
    this.maxlength = null;
    this.minlength = null;
    this.disabled = false;
    this.readonly = false;
    this.required = false;
    this.autoResize = false;
    this.resize = "vertical";
    this.size = "md";
    this.variant = "default";
    this.helperText = "";
    this.errorText = "";
    this.showCounter = false;
    this.autocomplete = "off";
    this.spellcheck = "true";
  }

  firstUpdated() {
    super.firstUpdated();
    if (this.autoResize) {
      this._adjustHeight();
    }
  }

  /**
   * Auto-resize functionality
   */
  _adjustHeight() {
    const textarea = this.shadowRoot.querySelector("textarea");
    if (!textarea || !this.autoResize) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    const newHeight = Math.max(textarea.scrollHeight, this.rows * 24); // 24px approximate line height
    textarea.style.height = `${newHeight}px`;
  }

  /**
   * Handle input events
   */
  _handleInput(e) {
    this.value = e.target.value;

    if (this.autoResize) {
      this._adjustHeight();
    }

    this.dispatchEvent(
      new CustomEvent("input", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, originalEvent: e },
      })
    );
  }

  /**
   * Handle change events
   */
  _handleChange(e) {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true,
        detail: { value: this.value, originalEvent: e },
      })
    );
  }

  /**
   * Handle focus events
   */
  _handleFocus(e) {
    this.dispatchEvent(
      new CustomEvent("focus", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }

  /**
   * Handle blur events
   */
  _handleBlur(e) {
    this.dispatchEvent(
      new CustomEvent("blur", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }

  /**
   * Get the current character count
   */
  get characterCount() {
    return this.value.length;
  }

  /**
   * Check if character count is over limit
   */
  get isOverLimit() {
    return this.maxlength && this.characterCount > this.maxlength;
  }

  /**
   * Public method to focus the textarea
   */
  focus() {
    const textarea = this.shadowRoot.querySelector("textarea");
    if (textarea) {
      textarea.focus();
    }
  }

  /**
   * Public method to blur the textarea
   */
  blur() {
    const textarea = this.shadowRoot.querySelector("textarea");
    if (textarea) {
      textarea.blur();
    }
  }

  /**
   * Public method to select all text
   */
  selectAll() {
    const textarea = this.shadowRoot.querySelector("textarea");
    if (textarea) {
      textarea.select();
    }
  }

  render() {
    const containerClasses = [
      "textarea-container",
      `size-${this.size}`,
      `variant-${this.variant}`,
      `resize-${this.resize}`,
      this.autoResize ? "auto-resize" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const showError = this.errorText && this.variant === "error";

    return html`
      <div class="${containerClasses}">
        ${this.label
          ? html`
              <label
                for="${textareaId}"
                class="label ${this.required ? "required" : ""}"
              >
                ${this.label}
              </label>
            `
          : ""}

        <div class="textarea-wrapper">
          <textarea
            id="${textareaId}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            name="${this.name}"
            rows="${this.rows}"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
            ?required="${this.required}"
            maxlength="${this.maxlength || ""}"
            minlength="${this.minlength || ""}"
            autocomplete="${this.autocomplete}"
            spellcheck="${this.spellcheck}"
            aria-describedby="${this.helperText || this.errorText
              ? `${textareaId}-help`
              : ""}"
            aria-invalid="${this.variant === "error" ? "true" : "false"}"
            @input="${this._handleInput}"
            @change="${this._handleChange}"
            @focus="${this._handleFocus}"
            @blur="${this._handleBlur}"
          ></textarea>

          ${this.showCounter && this.maxlength
            ? html`
                <div
                  class="counter ${this.isOverLimit ? "over-limit" : ""}"
                  aria-live="polite"
                >
                  ${this.characterCount}/${this.maxlength}
                </div>
              `
            : ""}
        </div>

        ${this.helperText && !showError
          ? html`
              <div id="${textareaId}-help" class="helper-text">
                ${this.helperText}
              </div>
            `
          : ""}

        ${showError
          ? html`
              <div
                id="${textareaId}-help"
                class="error-text"
                role="alert"
                aria-live="polite"
              >
                ${this.errorText}
              </div>
            `
          : ""}

        <!-- Screen reader announcements -->
        ${this.required
          ? html`<span class="sr-only">Required field</span>`
          : ""}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-textarea")) {
  customElements.define("neo-textarea", NeoTextArea);
}