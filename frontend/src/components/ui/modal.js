import { LitElement, html, css } from "lit";

export class NeoModal extends LitElement {
  static get properties() {
    return {
      open: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return css`
      :host {
        --modal-width: 500px;
        --modal-max-width: 90vw;
        --modal-height: auto;
        --modal-max-height: 90vh;
        --modal-padding: 1.5rem;
        --modal-border-radius: 8px;
        --modal-background: white;
        --modal-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        --backdrop-color: rgba(0, 0, 0, 0.5);
      }

      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: var(--backdrop-color);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: var(--modal-background);
        width: var(--modal-width);
        max-width: var(--modal-max-width);
        height: var(--modal-height);
        max-height: var(--modal-max-height);
        border-radius: var(--modal-border-radius);
        box-shadow: var(--modal-shadow);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      .modal-header {
        padding: var(--modal-padding);
        border-bottom: 1px solid #eee;
      }

      .modal-content {
        padding: var(--modal-padding);
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        padding: var(--modal-padding);
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }

      :host([hidden]) {
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.open = false;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.open) {
      this.close();
    }
  }

  handleBackdropClick(event) {
    if (event.target.classList.contains("modal-backdrop")) {
      this.close();
    }
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("modal-close"));
  }

  updated(changedProperties) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this.style.display = "block";
        this.dispatchEvent(new CustomEvent("modal-open"));
      } else {
        this.style.display = "none";
      }
    }
  }

  render() {
    if (!this.open) return html``;

    return html`
      <div class="modal-backdrop" @click=${this.handleBackdropClick}>
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <slot name="header"></slot>
          </div>
          <div class="modal-content">
            <slot name="content"></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define("neo-modal", NeoModal);
