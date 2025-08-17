import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Divider component for visual separation of content
 * @element neo-divider
 *
 * @prop {string} orientation - Orientation of the divider (horizontal, vertical)
 * @prop {string} variant - Style variant (solid, dashed, dotted)
 * @prop {string} size - Thickness/size of the divider (thin, medium, thick)
 * @prop {string} color - Color of the divider (default, muted, primary, secondary)
 * @prop {string} spacing - Spacing around the divider (none, sm, md, lg, xl)
 * @prop {boolean} decorative - Whether this is purely decorative (affects ARIA)
 *
 * @example
 * <neo-divider></neo-divider>
 * <neo-divider orientation="vertical" variant="dashed"></neo-divider>
 * <neo-divider>or</neo-divider>
 */
export class NeoDivider extends BaseComponent {
  static get properties() {
    return {
      orientation: { type: String, reflect: true },
      variant: { type: String, reflect: true },
      size: { type: String, reflect: true },
      color: { type: String, reflect: true },
      spacing: { type: String, reflect: true },
      decorative: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        :host([orientation="vertical"]) {
          display: inline-block;
          height: auto;
        }

        .divider-container {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .divider-container.horizontal {
          flex-direction: row;
          width: 100%;
        }

        .divider-container.vertical {
          flex-direction: column;
          height: 100%;
          min-height: 2rem; /* Minimum height for vertical dividers */
        }

        .divider-line {
          flex: 1;
          border: none;
          margin: 0;
        }

        /* Horizontal divider lines */
        .horizontal .divider-line {
          height: 0;
          border-bottom-style: solid;
        }

        /* Vertical divider lines */
        .vertical .divider-line {
          width: 0;
          border-right-style: solid;
          height: 100%;
          min-height: inherit;
        }

        /* Size variants */
        .size-thin .horizontal .divider-line {
          border-bottom-width: 1px;
        }

        .size-medium .horizontal .divider-line {
          border-bottom-width: 2px;
        }

        .size-thick .horizontal .divider-line {
          border-bottom-width: 4px;
        }

        .size-thin .vertical .divider-line {
          border-right-width: 1px;
        }

        .size-medium .vertical .divider-line {
          border-right-width: 2px;
        }

        .size-thick .vertical .divider-line {
          border-right-width: 4px;
        }

        /* Variant styles */
        .variant-solid .divider-line {
          border-style: solid;
        }

        .variant-dashed .divider-line {
          border-style: dashed;
        }

        .variant-dotted .divider-line {
          border-style: dotted;
        }

        /* Color variants */
        .color-default .divider-line {
          border-color: var(--color-border);
        }

        .color-muted .divider-line {
          border-color: var(--color-gray-200);
        }

        .color-primary .divider-line {
          border-color: var(--color-primary);
        }

        .color-secondary .divider-line {
          border-color: var(--color-secondary);
        }

        /* Content styling */
        .divider-content {
          padding: 0 var(--spacing-sm);
          background: var(--color-surface);
          color: var(--color-text-light);
          font-size: var(--font-size-sm);
          white-space: nowrap;
        }

        .vertical .divider-content {
          padding: var(--spacing-sm) 0;
        }

        /* Spacing variants */
        .spacing-none {
          margin: 0;
        }

        .spacing-sm.horizontal {
          margin: var(--spacing-sm) 0;
        }

        .spacing-md.horizontal {
          margin: var(--spacing-md) 0;
        }

        .spacing-lg.horizontal {
          margin: var(--spacing-lg) 0;
        }

        .spacing-xl.horizontal {
          margin: var(--spacing-xl) 0;
        }

        .spacing-sm.vertical {
          margin: 0 var(--spacing-sm);
        }

        .spacing-md.vertical {
          margin: 0 var(--spacing-md);
        }

        .spacing-lg.vertical {
          margin: 0 var(--spacing-lg);
        }

        .spacing-xl.vertical {
          margin: 0 var(--spacing-xl);
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .divider-line {
            border-color: var(--color-text) !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .divider-container {
            transition: none;
          }
        }

        /* Focus styles for interactive dividers with content */
        :host(:focus-visible) .divider-content {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.orientation = "horizontal";
    this.variant = "solid";
    this.size = "thin";
    this.color = "default";
    this.spacing = "md";
    this.decorative = true;
  }

  /**
   * Check if divider has content
   */
  get hasContent() {
    const slot = this.shadowRoot?.querySelector("slot");
    return slot?.assignedNodes()?.length > 0;
  }

  /**
   * Get container classes
   */
  _getContainerClasses() {
    const classes = ["divider-container"];
    
    classes.push(this.orientation);
    classes.push(`variant-${this.variant}`);
    classes.push(`size-${this.size}`);
    classes.push(`color-${this.color}`);
    classes.push(`spacing-${this.spacing}`);
    
    return classes.join(" ");
  }

  /**
   * Get ARIA attributes based on content and decorative flag
   */
  _getAriaAttributes() {
    if (this.decorative) {
      return {
        "aria-hidden": "true",
        role: "presentation"
      };
    }
    
    return {
      role: "separator",
      "aria-orientation": this.orientation
    };
  }

  render() {
    const containerClasses = this._getContainerClasses();
    const ariaAttrs = this._getAriaAttributes();
    const hasSlottedContent = this.hasContent;

    return html`
      <div
        class="${containerClasses}"
        role="${ariaAttrs.role || ""}"
        aria-hidden="${ariaAttrs["aria-hidden"] || ""}"
        aria-orientation="${ariaAttrs["aria-orientation"] || ""}"
      >
        ${hasSlottedContent
          ? html`
              <div class="divider-line"></div>
              <div class="divider-content">
                <slot></slot>
              </div>
              <div class="divider-line"></div>
            `
          : html`<div class="divider-line"></div>`}
      </div>
    `;
  }

  /**
   * Update hasContent when slot content changes
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    
    // Listen for slot changes to update layout
    const slot = this.shadowRoot?.querySelector("slot");
    if (slot) {
      slot.addEventListener("slotchange", () => {
        this.requestUpdate();
      });
    }
  }
}

// Register the component
if (!customElements.get("neo-divider")) {
  customElements.define("neo-divider", NeoDivider);
}