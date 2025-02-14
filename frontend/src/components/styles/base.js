import { css } from "lit";

export const baseStyles = css`
  :host {
    --font-family:
      system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
    --color-primary: #3b82f6;
    --color-primary-dark: #2563eb;
    --color-secondary: #6b7280;
    --color-text: #1f2937;
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --radius-md: 0.375rem;
    --font-weight-medium: 500;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --transition-fast: 150ms ease-in-out;
    --button-padding: var(--spacing-sm) var(--spacing-md);
    --button-height: 2.5rem;

    /* Colors */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #dc2626;
    --color-text-secondary: #6b7280;
    --color-background: #ffffff;
    --color-border: #d1d5db;

    /* Typography */
    --font-weight-normal: 400;
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
    --radius-lg: 0.5rem;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

    /* Transitions */
    --transition-normal: 250ms;
    --transition-slow: 350ms;

    /* Z-index */
    --z-index-dropdown: 1000;
    --z-index-sticky: 1020;
    --z-index-fixed: 1030;
    --z-index-modal: 1040;
    --z-index-popover: 1050;
    --z-index-tooltip: 1060;

    /* Component specific */
    --input-height: 2.5rem;
    --input-padding: 0.5rem 0.75rem;
  }

  /* Reset */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Typography */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    font-weight: var(--font-weight-medium);
    line-height: 1.2;
  }

  p {
    margin: 0;
    line-height: 1.5;
  }

  /* Links */
  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Lists */
  ul,
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Focus styles */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Utility classes */
  .visually-hidden {
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

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .gap-1 {
    gap: var(--spacing-xs);
  }

  .gap-2 {
    gap: var(--spacing-sm);
  }

  .gap-4 {
    gap: var(--spacing-md);
  }
`;
