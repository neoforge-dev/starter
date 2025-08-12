import { css } from "lit";

export const baseStyles = css`
  :host {
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

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  button:hover {
    background: var(--primary-color);
    filter: brightness(0.95);
  }

  button:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    background: var(--primary-color);
    color: white;
  }

  .button:hover {
    filter: brightness(0.95);
  }

  .button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--secondary {
    background: var(--secondary-color);
  }

  .button--secondary:hover {
    filter: brightness(0.95);
  }

  .button--ghost {
    background: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  .button--ghost:hover {
    background: var(--surface-color);
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
    color: var(--text-color);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }

  .input::placeholder {
    color: var(--text-tertiary);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input--error {
    border-color: var(--error-color);
  }

  .input--error:focus {
    box-shadow: 0 0 0 1px var(--error-color);
  }

  .input-label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
  }

  .error-message {
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--error-color);
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
