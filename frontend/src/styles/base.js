import { css } from "lit";

export const baseStyles = css`
  :host {
    /* Colors */
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-background: #ffffff;
    --color-text: #1f2937;
    --color-text-secondary: #4b5563;
    --color-border: #e5e7eb;

    /* Typography */
    --font-family: system-ui, -apple-system, sans-serif;
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;

    /* Border Radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none !important;
  }

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
`;

export const buttonStyles = css`
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-tight);
    text-align: center;
    cursor: pointer;
    user-select: none;
    transition: all var(--transition-fast);
    border: none;
    background: var(--brand);
    color: white;
  }

  .button:hover {
    background: var(--brand-hover);
  }

  .button:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 var(--focus-ring-offset) var(--surface-1),
      0 0 0 calc(var(--focus-ring-offset) + 2px) var(--focus-ring-color);
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--secondary {
    background: var(--secondary-color);
  }

  .button--secondary:hover {
    background: var(--surface-3);
  }

  .button--ghost {
    background: transparent;
    color: var(--text-1);
    border: 1px solid var(--surface-3);
  }

  .button--ghost:hover {
    background: var(--surface-2);
  }

  .button--small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }

  .button--large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
  }

  .button--icon {
    padding: var(--spacing-sm);
    border-radius: var(--radius-full);
  }
`;

export const inputStyles = css`
  .input-wrapper {
    position: relative;
  }

  .input {
    display: block;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    line-height: var(--line-height-normal);
    color: var(--text-1);
    background: var(--surface-1);
    border: 1px solid var(--surface-3);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .input:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 1px var(--brand);
  }

  .input::placeholder {
    color: var(--text-3);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input--error {
    border-color: var(--error);
  }

  .input--error:focus {
    box-shadow: 0 0 0 1px var(--error);
  }

  .input-label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-2);
  }

  .error-message {
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--error);
  }
`;

// Common mixins
export const LoadingMixin = (superClass) =>
  class extends superClass {
    static properties = {
      loading: { type: Boolean, reflect: true },
    };

    constructor() {
      super();
      this.loading = false;
    }
  };

export const ErrorMixin = (superClass) =>
  class extends superClass {
    static properties = {
      error: { type: String, reflect: true },
    };

    constructor() {
      super();
      this.error = "";
    }

    showError(message) {
      this.error = message;
      setTimeout(() => {
        this.error = "";
      }, 5000);
    }
  };
