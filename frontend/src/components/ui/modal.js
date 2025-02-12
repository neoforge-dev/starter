import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Modal component for dialogs and popovers
 * @element neo-modal
 *
 * @prop {boolean} open - Whether the modal is open
 * @prop {string} size - Modal size (sm, md, lg, xl, full)
 * @prop {boolean} closeOnEscape - Close modal on Escape key
 * @prop {boolean} closeOnOverlayClick - Close modal on overlay click
 * @prop {boolean} preventScroll - Prevent body scroll when modal is open
 * @prop {string} position - Modal position (center, top, right, bottom, left)
 *
 * @slot - Default slot for modal content
 * @slot header - Modal header content
 * @slot footer - Modal footer content
 * @slot close-icon - Custom close icon
 *
 * @fires open - When modal opens
 * @fires close - When modal closes
 * @fires overlay-click - When overlay is clicked
 */
export class Modal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    size: { type: String, reflect: true },
    closeOnEscape: { type: Boolean },
    closeOnOverlayClick: { type: Boolean },
    preventScroll: { type: Boolean },
    position: { type: String, reflect: true },
    _animating: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: var(--z-modal);
      }

      :host([open]) {
        display: block;
      }

      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity var(--transition-normal);
      }

      :host([open]) .modal-backdrop {
        opacity: 1;
      }

      .modal-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -40%);
        background: var(--surface-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        width: 90%;
        max-height: 90vh;
        opacity: 0;
        transition: all var(--transition-normal);
      }

      :host([open]) .modal-container {
        transform: translate(-50%, -50%);
        opacity: 1;
      }

      /* Size variants */
      .modal-size-small {
        max-width: 400px;
      }

      .modal-size-medium {
        max-width: 600px;
      }

      .modal-size-large {
        max-width: 800px;
      }

      .modal-size-full {
        width: 95%;
        max-width: 1200px;
      }

      .modal-header {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .modal-title {
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        color: var(--text-color);
        margin: 0;
      }

      .close-button {
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: var(--spacing-xs);
        border-radius: var(--radius-full);
        transition: all var(--transition-normal);
        font-size: var(--text-xl);
      }

      .close-button:hover {
        color: var(--text-color);
        background: var(--surface-color);
      }

      .modal-content {
        padding: var(--spacing-md);
        overflow-y: auto;
        max-height: calc(90vh - 130px);
      }

      .modal-footer {
        padding: var(--spacing-md);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
      }

      /* Scrollbar styling */
      .modal-content::-webkit-scrollbar {
        width: 8px;
      }

      .modal-content::-webkit-scrollbar-track {
        background: var(--surface-color);
      }

      .modal-content::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: var(--radius-full);
      }

      .modal-content::-webkit-scrollbar-thumb:hover {
        background: var(--text-tertiary);
      }
    `,
  ];

  constructor() {
    super();
    this.open = false;
    this.size = "md";
    this.closeOnEscape = true;
    this.closeOnOverlayClick = true;
    this.preventScroll = true;
    this.position = "center";
    this._animating = false;
    this._originalOverflow = "";
    this._handleEscape = this._handleEscape.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleEscape);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleEscape);
    this._enableScroll();
  }

  updated(changedProperties) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this._handleOpen();
      } else {
        this._handleClose();
      }
    }
  }

  /**
   * Handle modal open
   */
  _handleOpen() {
    this._animating = true;
    if (this.preventScroll) {
      this._disableScroll();
    }
    this.dispatchEvent(
      new CustomEvent("open", {
        bubbles: true,
        composed: true,
      })
    );
    // Focus first focusable element
    requestAnimationFrame(() => {
      const focusable = this.shadowRoot.querySelector(
        '[autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      }
    });
  }

  /**
   * Handle modal close
   */
  _handleClose() {
    this._animating = true;
    if (this.preventScroll) {
      this._enableScroll();
    }
    this.dispatchEvent(
      new CustomEvent("close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle escape key
   * @param {KeyboardEvent} e
   */
  _handleEscape(e) {
    if (this.open && this.closeOnEscape && e.key === "Escape") {
      this.open = false;
    }
  }

  /**
   * Handle overlay click
   * @param {MouseEvent} e
   */
  _handleOverlayClick(e) {
    if (this.closeOnOverlayClick && e.target === e.currentTarget) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("overlay-click", {
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  /**
   * Handle animation end
   */
  _handleAnimationEnd() {
    this._animating = false;
  }

  /**
   * Disable body scroll
   */
  _disableScroll() {
    this._originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  /**
   * Enable body scroll
   */
  _enableScroll() {
    document.body.style.overflow = this._originalOverflow;
  }

  render() {
    if (!this.open && !this._animating) return null;

    return html`
      <div
        class="modal-backdrop"
        data-position=${this.position}
        data-open=${this.open}
        @click=${this._handleOverlayClick}
        @animationend=${this._handleAnimationEnd}
      ></div>
      <div class="modal-container modal-size-${this.size}">
        <div class="modal-header">
          <h2 class="modal-title">${this.title}</h2>
          ${this.closeOnEscape
            ? html`
                <button
                  class="close-button"
                  @click="${() => (this.open = false)}"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              `
            : ""}
        </div>
        <div class="modal-content">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define("neo-modal", Modal);

// Create a modal service for programmatic modal creation
class ModalService {
  show(options = {}) {
    const modal = document.createElement("neo-modal");
    Object.assign(modal, options);
    document.body.appendChild(modal);
    modal.open = true;

    return new Promise((resolve) => {
      modal.addEventListener("modal-close", () => {
        document.body.removeChild(modal);
        resolve();
      });
    });
  }

  confirm(options = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement("neo-modal");
      const content = document.createElement("div");
      content.textContent = options.message || "Are you sure?";

      const footer = document.createElement("div");
      footer.slot = "footer";

      const confirmBtn = document.createElement("neo-button");
      confirmBtn.textContent = options.confirmText || "Confirm";
      confirmBtn.variant = "primary";

      const cancelBtn = document.createElement("neo-button");
      cancelBtn.textContent = options.cancelText || "Cancel";
      cancelBtn.variant = "outline";

      confirmBtn.addEventListener("click", () => {
        modal.open = false;
        resolve(true);
      });

      cancelBtn.addEventListener("click", () => {
        modal.open = false;
        resolve(false);
      });

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      modal.appendChild(content);
      modal.appendChild(footer);

      Object.assign(modal, {
        title: options.title || "Confirm",
        size: options.size || "small",
        preventClose: true,
        ...options,
      });

      document.body.appendChild(modal);
      modal.open = true;

      modal.addEventListener("modal-close", () => {
        document.body.removeChild(modal);
      });
    });
  }
}

export const modal = new ModalService();
