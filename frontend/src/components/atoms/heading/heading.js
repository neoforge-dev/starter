import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Heading component with semantic and visual level separation
 * @element neo-heading
 *
 * @prop {string} level - Semantic heading level (1-6)
 * @prop {string} visualLevel - Visual styling level (1-6, independent of semantic level)
 * @prop {string} size - Size override (xs, sm, md, lg, xl, 2xl, 3xl)
 * @prop {string} weight - Font weight (normal, medium, semibold, bold)
 * @prop {string} color - Text color (default, muted, primary, secondary, error, success, warning)
 * @prop {boolean} truncate - Whether to truncate long text with ellipsis
 * @prop {string} align - Text alignment (left, center, right)
 *
 * @example
 * <neo-heading level="1" visual-level="3">Main Title</neo-heading>
 * <neo-heading level="2" size="lg">Section Title</neo-heading>
 */
export class NeoHeading extends BaseComponent {
  static get properties() {
    return {
      level: { type: String, reflect: true },
      visualLevel: { type: String, attribute: "visual-level" },
      size: { type: String, reflect: true },
      weight: { type: String, reflect: true },
      color: { type: String, reflect: true },
      truncate: { type: Boolean, reflect: true },
      align: { type: String, reflect: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          margin: 0;
        }

        .heading {
          margin: 0;
          font-family: var(--font-family);
          line-height: 1.2;
          color: var(--color-text);
          word-wrap: break-word;
        }

        /* Semantic heading levels (default visual styling) */
        .level-1 {
          font-size: 2.25rem; /* 36px */
          font-weight: var(--font-weight-bold);
          line-height: 1.1;
        }

        .level-2 {
          font-size: 1.875rem; /* 30px */
          font-weight: var(--font-weight-semibold);
          line-height: 1.15;
        }

        .level-3 {
          font-size: 1.5rem; /* 24px */
          font-weight: var(--font-weight-semibold);
          line-height: 1.2;
        }

        .level-4 {
          font-size: 1.25rem; /* 20px */
          font-weight: var(--font-weight-medium);
          line-height: 1.25;
        }

        .level-5 {
          font-size: 1.125rem; /* 18px */
          font-weight: var(--font-weight-medium);
          line-height: 1.3;
        }

        .level-6 {
          font-size: 1rem; /* 16px */
          font-weight: var(--font-weight-medium);
          line-height: 1.35;
        }

        /* Size overrides */
        .size-xs {
          font-size: 0.75rem; /* 12px */
        }

        .size-sm {
          font-size: 0.875rem; /* 14px */
        }

        .size-md {
          font-size: 1rem; /* 16px */
        }

        .size-lg {
          font-size: 1.125rem; /* 18px */
        }

        .size-xl {
          font-size: 1.25rem; /* 20px */
        }

        .size-2xl {
          font-size: 1.5rem; /* 24px */
        }

        .size-3xl {
          font-size: 1.875rem; /* 30px */
        }

        /* Font weight variants */
        .weight-normal {
          font-weight: var(--font-weight-normal);
        }

        .weight-medium {
          font-weight: var(--font-weight-medium);
        }

        .weight-semibold {
          font-weight: var(--font-weight-semibold);
        }

        .weight-bold {
          font-weight: var(--font-weight-bold);
        }

        /* Color variants */
        .color-default {
          color: var(--color-text);
        }

        .color-muted {
          color: var(--color-text-light);
        }

        .color-primary {
          color: var(--color-primary);
        }

        .color-secondary {
          color: var(--color-secondary);
        }

        .color-error {
          color: var(--color-error);
        }

        .color-success {
          color: var(--color-success);
        }

        .color-warning {
          color: var(--color-warning);
        }

        /* Text alignment */
        .align-left {
          text-align: left;
        }

        .align-center {
          text-align: center;
        }

        .align-right {
          text-align: right;
        }

        /* Truncation */
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Responsive typography */
        @media (max-width: 768px) {
          .level-1 {
            font-size: 1.875rem; /* 30px on mobile */
          }

          .level-2 {
            font-size: 1.5rem; /* 24px on mobile */
          }

          .level-3 {
            font-size: 1.25rem; /* 20px on mobile */
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .heading {
            font-weight: var(--font-weight-bold);
          }
        }

        /* Focus styles for interactive headings */
        :host(:focus-visible) .heading {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.level = "1";
    this.visualLevel = "";
    this.size = "";
    this.weight = "";
    this.color = "default";
    this.truncate = false;
    this.align = "left";
  }

  /**
   * Get the semantic heading tag (h1-h6)
   */
  _getSemanticTag() {
    const level = parseInt(this.level, 10);
    if (level >= 1 && level <= 6) {
      return `h${level}`;
    }
    return "h1"; // Default fallback
  }

  /**
   * Get the visual level for styling
   */
  _getVisualLevel() {
    if (this.visualLevel) {
      const visual = parseInt(this.visualLevel, 10);
      if (visual >= 1 && visual <= 6) {
        return visual;
      }
    }
    return parseInt(this.level, 10); // Use semantic level as default
  }

  /**
   * Build CSS classes for the heading
   */
  _getClasses() {
    const classes = ["heading"];
    
    // Visual level styling (unless size override is provided)
    if (!this.size) {
      classes.push(`level-${this._getVisualLevel()}`);
    }
    
    // Size override
    if (this.size) {
      classes.push(`size-${this.size}`);
    }
    
    // Weight
    if (this.weight) {
      classes.push(`weight-${this.weight}`);
    }
    
    // Color
    classes.push(`color-${this.color}`);
    
    // Alignment
    classes.push(`align-${this.align}`);
    
    // Truncation
    if (this.truncate) {
      classes.push("truncate");
    }
    
    return classes.join(" ");
  }

  /**
   * Render the appropriate heading tag
   */
  _renderHeading() {
    const tag = this._getSemanticTag();
    const classes = this._getClasses();
    
    // Create the heading element dynamically
    const headingTemplate = `<${tag} class="${classes}"><slot></slot></${tag}>`;
    
    // Use unsafeHTML for dynamic tag creation
    return html`${this._createHeadingElement(tag, classes)}`;
  }

  /**
   * Create heading element safely
   */
  _createHeadingElement(tag, classes) {
    // Create the appropriate heading element
    switch (tag) {
      case "h1":
        return html`<h1 class="${classes}"><slot></slot></h1>`;
      case "h2":
        return html`<h2 class="${classes}"><slot></slot></h2>`;
      case "h3":
        return html`<h3 class="${classes}"><slot></slot></h3>`;
      case "h4":
        return html`<h4 class="${classes}"><slot></slot></h4>`;
      case "h5":
        return html`<h5 class="${classes}"><slot></slot></h5>`;
      case "h6":
        return html`<h6 class="${classes}"><slot></slot></h6>`;
      default:
        return html`<h1 class="${classes}"><slot></slot></h1>`;
    }
  }

  render() {
    return this._renderHeading();
  }
}

// Register the component
if (!customElements.get("neo-heading")) {
  customElements.define("neo-heading", NeoHeading);
}