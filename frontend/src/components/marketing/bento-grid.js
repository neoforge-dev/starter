import { 
  LitElement,
  html,
  css,
 } from 'lit';

export class BentoGrid extends LitElement {
  static properties = {
    items: { type: Array },
    columns: { type: Number },
    gap: { type: String },
    minHeight: { type: String },
    variant: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .bento-grid {
      display: grid;
      gap: var(--bento-gap, 1rem);
      grid-template-columns: repeat(var(--bento-columns, 3), 1fr);
      width: 100%;
    }

    .bento-item {
      position: relative;
      min-height: var(--bento-min-height, 200px);
      padding: 2rem;
      border-radius: 1rem;
      overflow: hidden;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      cursor: pointer;
    }

    /* Default variant */
    .bento-item-default {
      background-color: var(--bento-item-bg, #ffffff);
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.1),
        0 2px 4px -2px rgb(0 0 0 / 0.1);
    }

    .bento-item-default:hover {
      transform: translateY(-4px);
      box-shadow:
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    /* Gradient variant */
    .bento-item-gradient {
      color: white;
    }

    .bento-item-gradient::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--bento-item-gradient);
      opacity: 0.9;
      transition: opacity 0.3s ease;
    }

    .bento-item-gradient:hover::before {
      opacity: 1;
    }

    /* Bordered variant */
    .bento-item-bordered {
      background-color: var(--bento-item-bg, #ffffff);
      border: 2px solid var(--bento-item-border-color, #e5e7eb);
    }

    .bento-item-bordered:hover {
      border-color: var(--bento-item-border-hover-color, currentColor);
      transform: translateY(-4px);
    }

    /* Item content */
    .item-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .item-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: inline-block;
    }

    .item-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    }

    .item-description {
      font-size: 1rem;
      line-height: 1.6;
      opacity: 0.9;
      margin: 0;
      flex-grow: 1;
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .bento-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }

      .bento-item[style*="grid-column"] {
        grid-column: span 1 !important;
      }

      .bento-item[style*="grid-row"] {
        grid-row: span 1 !important;
      }
    }

    @media (max-width: 640px) {
      .bento-grid {
        gap: 1rem;
      }

      .bento-item {
        padding: 1.5rem;
        min-height: 150px;
      }

      .item-icon {
        font-size: 1.5rem;
      }

      .item-title {
        font-size: 1.125rem;
      }

      .item-description {
        font-size: 0.875rem;
      }
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.columns = 3;
    this.gap = "1rem";
    this.minHeight = "200px";
    this.variant = "default";
  }

  _getItemStyles(item) {
    const styles = {
      "grid-column": item.span?.cols ? `span ${item.span.cols}` : undefined,
      "grid-row": item.span?.rows ? `span ${item.span.rows}` : undefined,
      "--bento-item-gradient":
        this.variant === "gradient" ? item.gradient : undefined,
      "--bento-item-border-color":
        this.variant === "bordered" ? item.borderColor : undefined,
      "--bento-item-border-hover-color":
        this.variant === "bordered" ? item.borderColor : undefined,
    };

    return Object.entries(styles)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(";");
  }

  render() {
    const gridStyles = {
      "--bento-columns": this.columns,
      "--bento-gap": this.gap,
      "--bento-min-height": this.minHeight,
    };

    return html`
      <div
        class="bento-grid"
        style=${Object.entries(gridStyles)
          .map(([key, value]) => `${key}: ${value}`)
          .join(";")}
      >
        ${this.items.map(
          (item) => html`
            <div
              class="bento-item bento-item-${this.variant}"
              style=${this._getItemStyles(item)}
            >
              <div class="item-content">
                <span class="item-icon">${item.icon}</span>
                <h3 class="item-title">${item.title}</h3>
                <p class="item-description">${item.description}</p>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }
}

customElements.define("ui-bento-grid", BentoGrid);
