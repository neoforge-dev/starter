import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// Layout Component with improved mobile support
export class Layout extends LitElement {
  static properties = {
    variant: { type: String },
    fluid: { type: Boolean },
    gap: { type: String },
    padding: { type: String },
    sidebarOpen: { type: Boolean, reflect: true, attribute: "sidebar-open" },
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .layout {
      display: grid;
      min-height: 100vh;
      grid-template-rows: auto 1fr auto;
      position: relative;
      overflow-x: hidden;
    }

    .layout-dashboard {
      grid-template-columns: auto 1fr;
      grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
    }

    .layout-docs {
      grid-template-columns: 250px 1fr;
      grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
    }

    .layout-default,
    .layout-landing {
      grid-template-areas:
        "header"
        "main"
        "footer";
    }

    .header {
      grid-area: header;
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      background: var(--layout-header-bg, white);
      border-bottom: 1px solid var(--layout-border-color, #e5e7eb);
    }

    .sidebar {
      grid-area: sidebar;
      background: var(--layout-sidebar-bg, #f9fafb);
      border-right: 1px solid var(--layout-border-color, #e5e7eb);
      position: sticky;
      top: var(--header-height, 64px);
      height: calc(100vh - var(--header-height, 64px));
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .main {
      grid-area: main;
      background: var(--layout-main-bg, white);
      min-height: calc(100vh - var(--header-height, 64px));
      transition: transform var(--transition-normal);
    }

    .footer {
      grid-area: footer;
      background: var(--layout-footer-bg, white);
      border-top: 1px solid var(--layout-border-color, #e5e7eb);
    }

    /* Gap Utilities */
    .gap-none {
      gap: 0;
    }
    .gap-small {
      gap: 0.5rem;
    }
    .gap-medium {
      gap: 1rem;
    }
    .gap-large {
      gap: 2rem;
    }

    /* Padding Utilities */
    .padding-none {
      padding: 0;
    }
    .padding-small {
      padding: 0.5rem;
    }
    .padding-medium {
      padding: 1rem;
    }
    .padding-large {
      padding: 2rem;
    }

    /* Container Width */
    .container {
      margin: 0 auto;
      width: 100%;
      max-width: var(--layout-max-width, 1280px);
      padding-left: var(--layout-padding, 1rem);
      padding-right: var(--layout-padding, 1rem);
    }

    .fluid {
      max-width: none;
      padding-left: 0;
      padding-right: 0;
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .layout-dashboard,
      .layout-docs {
        grid-template-columns: 1fr;
        grid-template-areas:
          "header"
          "main"
          "footer";
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: var(--z-sidebar);
        transform: translateX(-100%);
        transition: transform var(--transition-normal);
      }

      :host([sidebar-open]) .sidebar {
        transform: translateX(0);
      }

      :host([sidebar-open]) .main {
        transform: translateX(80%);
        pointer-events: none;
      }

      :host([sidebar-open])::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: calc(var(--z-sidebar) - 1);
        opacity: 1;
        transition: opacity var(--transition-normal);
      }

      .container {
        padding-left: var(--layout-padding-mobile, 1rem);
        padding-right: var(--layout-padding-mobile, 1rem);
      }
    }

    /* Tablet Styles */
    @media (min-width: 769px) and (max-width: 1024px) {
      .layout-dashboard,
      .layout-docs {
        grid-template-columns: 80px 1fr;
      }

      .sidebar {
        width: 80px;
      }
    }
  `;

  constructor() {
    super();
    this.variant = "default";
    this.fluid = false;
    this.gap = "medium";
    this.padding = "medium";
    this.sidebarOpen = false;
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
    this._handleEscapeKey = this._handleEscapeKey.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleEscapeKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleEscapeKey);
  }

  _handleBackdropClick(e) {
    if (e.target === this && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.dispatchEvent(new CustomEvent("sidebar-close"));
    }
  }

  _handleEscapeKey(e) {
    if (e.key === "Escape" && this.sidebarOpen) {
      this.sidebarOpen = false;
      this.dispatchEvent(new CustomEvent("sidebar-close"));
    }
  }

  render() {
    const layoutClass = `layout layout-${this.variant} gap-${this.gap} padding-${this.padding}`;
    const containerClass = this.fluid ? "fluid" : "container";

    return html`
      <div class=${layoutClass} @click=${this._handleBackdropClick}>
        <header class="header">
          <div class=${containerClass}>
            <slot name="header"></slot>
          </div>
        </header>

        ${this.variant === "dashboard" || this.variant === "docs"
          ? html`
              <aside class="sidebar" role="complementary">
                <slot name="sidebar"></slot>
              </aside>
            `
          : ""}

        <main class="main" role="main">
          <div class=${containerClass}>
            <slot></slot>
          </div>
        </main>

        <footer class="footer" role="contentinfo">
          <div class=${containerClass}>
            <slot name="footer"></slot>
          </div>
        </footer>
      </div>
    `;
  }
}

// Grid Component
export class Grid extends LitElement {
  static properties = {
    columns: { type: Number },
    gap: { type: String },
    breakpoints: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
    }

    .grid {
      display: grid;
      width: 100%;
    }

    /* Gap Utilities */
    .gap-none {
      gap: 0;
    }
    .gap-small {
      gap: 0.5rem;
    }
    .gap-medium {
      gap: 1rem;
    }
    .gap-large {
      gap: 2rem;
    }

    /* Responsive Grid */
    @media (min-width: 640px) {
      .grid {
        grid-template-columns: repeat(var(--sm-cols, 1), 1fr);
      }
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(var(--md-cols, 2), 1fr);
      }
    }
    @media (min-width: 1024px) {
      .grid {
        grid-template-columns: repeat(var(--lg-cols, 3), 1fr);
      }
    }
    @media (min-width: 1280px) {
      .grid {
        grid-template-columns: repeat(var(--xl-cols, 4), 1fr);
      }
    }
  `;

  constructor() {
    super();
    this.columns = 3;
    this.gap = "medium";
    this.breakpoints = {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("breakpoints")) {
      this.style.setProperty("--sm-cols", this.breakpoints.sm);
      this.style.setProperty("--md-cols", this.breakpoints.md);
      this.style.setProperty("--lg-cols", this.breakpoints.lg);
      this.style.setProperty("--xl-cols", this.breakpoints.xl);
    }
  }

  render() {
    return html`
      <div class="grid gap-${this.gap}">
        <slot></slot>
      </div>
    `;
  }
}

// Container Component
export class Container extends LitElement {
  static properties = {
    size: { type: String },
    padding: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }

    .container {
      margin: 0 auto;
      width: 100%;
    }

    /* Size Variants */
    .size-small {
      max-width: 640px;
    }
    .size-medium {
      max-width: 768px;
    }
    .size-large {
      max-width: 1024px;
    }
    .size-xl {
      max-width: 1280px;
    }

    /* Padding Utilities */
    .padding-none {
      padding: 0;
    }
    .padding-small {
      padding: 0.5rem;
    }
    .padding-medium {
      padding: 1rem;
    }
    .padding-large {
      padding: 2rem;
    }
  `;

  constructor() {
    super();
    this.size = "medium";
    this.padding = "medium";
  }

  render() {
    return html`
      <div class="container size-${this.size} padding-${this.padding}">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("neo-layout", Layout);
customElements.define("ui-grid", Grid);
customElements.define("ui-container", Container);
