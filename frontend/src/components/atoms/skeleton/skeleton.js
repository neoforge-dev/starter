import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Skeleton Loader component for better loading UX
 * @element neo-skeleton
 *
 * @prop {string} variant - Type of skeleton (text, heading, paragraph, circle, rectangle, card)
 * @prop {string} width - Width of the skeleton (CSS value)
 * @prop {string} height - Height of the skeleton (CSS value)
 * @prop {number} lines - Number of text lines (for text/paragraph variants)
 * @prop {string} size - Size variant (xs, sm, md, lg, xl)
 * @prop {boolean} animated - Whether to show the shimmer animation
 * @prop {string} borderRadius - Custom border radius (CSS value)
 * @prop {string} theme - Color theme (light, dark)
 * @prop {number} count - Number of skeleton items to render
 * @prop {string} spacing - Spacing between multiple skeletons
 */
export class NeoSkeleton extends BaseComponent {
  static get properties() {
    return {
      variant: { type: String },
      width: { type: String },
      height: { type: String },
      lines: { type: Number },
      size: { type: String, reflect: true },
      animated: { type: Boolean, reflect: true },
      borderRadius: { type: String },
      theme: { type: String, reflect: true },
      count: { type: Number },
      spacing: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          --skeleton-base-color: #f2f2f2;
          --skeleton-highlight-color: #e0e0e0;
          --skeleton-animation-duration: 1.5s;
          --skeleton-border-radius: 4px;
        }

        :host([theme="dark"]) {
          --skeleton-base-color: #2a2a2a;
          --skeleton-highlight-color: #3a3a3a;
        }

        .skeleton-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing, var(--spacing-sm));
        }

        .skeleton {
          position: relative;
          background-color: var(--skeleton-base-color);
          border-radius: var(--skeleton-border-radius);
          overflow: hidden;
        }

        /* Animation */
        :host([animated]) .skeleton::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--skeleton-highlight-color) 50%,
            transparent 100%
          );
          animation: skeleton-shimmer var(--skeleton-animation-duration) infinite ease-in-out;
          transform: translateX(-100%);
        }

        @keyframes skeleton-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Variants */
        .skeleton.text {
          height: 1em;
          width: 100%;
          border-radius: 2px;
        }

        .skeleton.heading {
          height: 1.5em;
          width: 60%;
          border-radius: 2px;
        }

        .skeleton.paragraph {
          height: 1em;
          border-radius: 2px;
        }

        .skeleton.paragraph:last-child {
          width: 80%;
        }

        .skeleton.circle {
          border-radius: 50%;
        }

        .skeleton.rectangle {
          border-radius: var(--skeleton-border-radius);
        }

        .skeleton.card {
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        /* Sizes */
        :host([size="xs"]) .skeleton {
          --skeleton-border-radius: 2px;
        }

        :host([size="sm"]) .skeleton {
          --skeleton-border-radius: 3px;
        }

        :host([size="md"]) .skeleton {
          --skeleton-border-radius: 4px;
        }

        :host([size="lg"]) .skeleton {
          --skeleton-border-radius: 6px;
        }

        :host([size="xl"]) .skeleton {
          --skeleton-border-radius: 8px;
        }

        /* Size-specific dimensions */
        :host([size="xs"]) .skeleton.text {
          height: 0.75em;
        }

        :host([size="sm"]) .skeleton.text {
          height: 0.875em;
        }

        :host([size="md"]) .skeleton.text {
          height: 1em;
        }

        :host([size="lg"]) .skeleton.text {
          height: 1.125em;
        }

        :host([size="xl"]) .skeleton.text {
          height: 1.25em;
        }

        :host([size="xs"]) .skeleton.heading {
          height: 1em;
        }

        :host([size="sm"]) .skeleton.heading {
          height: 1.25em;
        }

        :host([size="md"]) .skeleton.heading {
          height: 1.5em;
        }

        :host([size="lg"]) .skeleton.heading {
          height: 1.75em;
        }

        :host([size="xl"]) .skeleton.heading {
          height: 2em;
        }

        /* Circle sizes */
        :host([size="xs"]) .skeleton.circle {
          width: 24px;
          height: 24px;
        }

        :host([size="sm"]) .skeleton.circle {
          width: 32px;
          height: 32px;
        }

        :host([size="md"]) .skeleton.circle {
          width: 40px;
          height: 40px;
        }

        :host([size="lg"]) .skeleton.circle {
          width: 56px;
          height: 56px;
        }

        :host([size="xl"]) .skeleton.circle {
          width: 72px;
          height: 72px;
        }

        /* Custom dimensions override defaults */
        .skeleton[style*="width"] {
          width: var(--custom-width) !important;
        }

        .skeleton[style*="height"] {
          height: var(--custom-height) !important;
        }

        /* Accessibility */
        .skeleton {
          position: relative;
        }

        .skeleton::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
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

        /* Card skeleton specific styles */
        .skeleton.card {
          min-height: 200px;
          background-color: var(--skeleton-base-color);
        }

        .card-header {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .card-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--skeleton-highlight-color);
          flex-shrink: 0;
        }

        .card-title-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .card-title {
          height: 1.25em;
          width: 70%;
          background-color: var(--skeleton-highlight-color);
          border-radius: 2px;
        }

        .card-subtitle {
          height: 1em;
          width: 50%;
          background-color: var(--skeleton-highlight-color);
          border-radius: 2px;
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .card-line {
          height: 1em;
          background-color: var(--skeleton-highlight-color);
          border-radius: 2px;
        }

        .card-line:nth-child(1) { width: 100%; }
        .card-line:nth-child(2) { width: 95%; }
        .card-line:nth-child(3) { width: 85%; }

        /* Multiple skeleton items */
        .skeleton-item:not(:last-child) {
          margin-bottom: var(--spacing, var(--spacing-sm));
        }

        /* Pulse animation variant (for non-animated fallback) */
        :host(:not([animated])) .skeleton {
          animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.variant = "text";
    this.width = "";
    this.height = "";
    this.lines = 1;
    this.size = "md";
    this.animated = true;
    this.borderRadius = "";
    this.theme = "light";
    this.count = 1;
    this.spacing = "";
  }

  /**
   * Get the CSS custom properties for dimensions
   */
  get customStyles() {
    const styles = {};
    
    if (this.width) {
      styles['--custom-width'] = this.width;
    }
    
    if (this.height) {
      styles['--custom-height'] = this.height;
    }

    if (this.borderRadius) {
      styles['--skeleton-border-radius'] = this.borderRadius;
    }

    if (this.spacing) {
      styles['--spacing'] = this.spacing;
    }

    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  /**
   * Render a single skeleton based on variant
   */
  _renderSkeleton() {
    const customStyles = this.customStyles;
    const styleAttr = customStyles ? `style="${customStyles}"` : '';

    switch (this.variant) {
      case 'heading':
        return html`<div class="skeleton heading" style="${customStyles}"></div>`;
      
      case 'paragraph':
        return html`
          ${Array.from({ length: this.lines }, (_, index) => html`
            <div class="skeleton paragraph" style="${customStyles}"></div>
          `)}
        `;
      
      case 'circle':
        return html`<div class="skeleton circle" style="${customStyles}"></div>`;
      
      case 'rectangle':
        return html`<div class="skeleton rectangle" style="${customStyles}"></div>`;
      
      case 'card':
        return html`
          <div class="skeleton card" style="${customStyles}">
            <div class="card-header">
              <div class="card-avatar"></div>
              <div class="card-title-group">
                <div class="card-title"></div>
                <div class="card-subtitle"></div>
              </div>
            </div>
            <div class="card-content">
              <div class="card-line"></div>
              <div class="card-line"></div>
              <div class="card-line"></div>
            </div>
          </div>
        `;
      
      case 'text':
      default:
        return html`<div class="skeleton text" style="${customStyles}"></div>`;
    }
  }

  render() {
    return html`
      <div 
        class="skeleton-container"
        role="status" 
        aria-live="polite"
        aria-label="Content loading"
      >
        ${Array.from({ length: this.count }, (_, index) => html`
          <div class="skeleton-item" key="${index}">
            ${this._renderSkeleton()}
          </div>
        `)}
        
        <!-- Screen reader announcement -->
        <span class="sr-only">Loading content, please wait...</span>
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-skeleton")) {
  customElements.define("neo-skeleton", NeoSkeleton);
}