import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Enhanced modal component with accessibility and animations
 * @element neo-modal
 *
 * @prop {boolean} open - Whether the modal is open
 * @prop {string} size - Modal size (sm, md, lg, xl, full)
 * @prop {boolean} closeOnEscape - Close modal on Escape key
 * @prop {boolean} closeOnOverlayClick - Close modal on overlay click
 * @prop {boolean} preventScroll - Prevent body scroll when modal is open
 * @prop {string} position - Modal position (center, top, right, bottom, left)
 * @prop {string} title - Modal title
 * @prop {boolean} showClose - Show close button
 * @prop {boolean} persistent - Prevent closing by overlay click or escape key
 * @prop {string} animation - Animation type (fade, slide, scale)
 *
 * @slot - Default slot for modal content
 * @slot header - Modal header content
 * @slot footer - Modal footer content
 * @slot close-icon - Custom close icon
 *
 * @fires open - When modal opens
 * @fires close - When modal closes
 * @fires overlay-click - When overlay is clicked
 * @fires animation-end - When animation ends
 */
export class Modal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    size: { type: String, reflect: true },
    closeOnEscape: { type: Boolean },
    closeOnOverlayClick: { type: Boolean },
    preventScroll: { type: Boolean },
    position: { type: String, reflect: true },
    title: { type: String },
    showClose: { type: Boolean },
    persistent: { type: Boolean },
    animation: { type: String },
    _animating: { type: Boolean, state: true },
    _lastFocusedElement: { type: Object, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        --modal-padding: var(--spacing-md);
        --modal-border-radius: var(--radius-lg);
        --modal-max-height: 90vh;
        --modal-min-width: 320px;

        display: none;
        position: fixed;
        inset: 0;
        z-index: var(--z-modal);
      }

      :host([open]) {
        display: block;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
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
        background: var(--surface-color);
        border-radius: var(--modal-border-radius);
        box-shadow: var(--shadow-xl);
        min-width: var(--modal-min-width);
        max-width: 90%;
        max-height: var(--modal-max-height);
        opacity: 0;
        transition: all var(--transition-normal);
      }

      /* Position variants */
      :host([position="center"]) .modal-container {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -40%) scale(0.95);
      }

      :host([position="top"]) .modal-container {
        top: -100%;
        left: 50%;
        transform: translateX(-50%);
      }

      :host([position="right"]) .modal-container {
        top: 0;
        right: -100%;
        height: 100%;
        margin: 0;
      }

      :host([position="bottom"]) .modal-container {
        bottom: -100%;
        left: 50%;
        transform: translateX(-50%);
      }

      :host([position="left"]) .modal-container {
        top: 0;
        left: -100%;
        height: 100%;
        margin: 0;
      }

      /* Open state positions */
      :host([open][position="center"]) .modal-container {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }

      :host([open][position="top"]) .modal-container {
        top: var(--spacing-lg);
        opacity: 1;
      }

      :host([open][position="right"]) .modal-container {
        right: 0;
        opacity: 1;
      }

      :host([open][position="bottom"]) .modal-container {
        bottom: var(--spacing-lg);
        opacity: 1;
      }

      :host([open][position="left"]) .modal-container {
        left: 0;
        opacity: 1;
      }

      /* Size variants */
      :host([size="sm"]) .modal-container {
        width: 400px;
      }

      :host([size="md"]) .modal-container {
        width: 600px;
      }

      :host([size="lg"]) .modal-container {
        width: 800px;
      }

      :host([size="xl"]) .modal-container {
        width: 1000px;
      }

      :host([size="full"]) .modal-container {
        width: 95%;
        max-width: 1200px;
      }

      .modal-header {
        padding: var(--modal-padding);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .modal-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--text-color);
        margin: 0;
      }

      .close-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        background: none;
        border: none;
        border-radius: var(--radius-full);
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .close-button:hover {
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        color: var(--text-color);
      }

      .close-button:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      .modal-content {
        padding: var(--modal-padding);
        overflow-y: auto;
        max-height: calc(var(--modal-max-height) - 130px);
      }

      .modal-footer {
        padding: var(--modal-padding);
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

      /* Animation variants */
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes scaleIn {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      :host([animation="fade"]) .modal-container {
        animation: fadeIn var(--transition-normal) forwards;
      }

      :host([animation="slide"]) .modal-container {
        animation: slideIn var(--transition-normal) forwards;
      }

      :host([animation="scale"]) .modal-container {
        animation: scaleIn var(--transition-normal) forwards;
      }

      /* Responsive styles */
      @media (max-width: 640px) {
        .modal-container {
          width: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          margin: 0;
          border-radius: 0;
        }

        :host([position="center"]) .modal-container,
        :host([position="top"]) .modal-container,
        :host([position="bottom"]) .modal-container {
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          transform: none;
        }

        .modal-content {
          max-height: calc(100vh - 130px);
        }
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
    this.title = "";
    this.showClose = true;
    this.persistent = false;
    this.animation = "fade";
    this._animating = false;
    this._lastFocusedElement = null;
    this._handleEscape = this._handleEscape.bind(this);
    this._handleFocusTrap = this._handleFocusTrap.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleEscape);
    document.addEventListener("keydown", this._handleFocusTrap);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleEscape);
    document.removeEventListener("keydown", this._handleFocusTrap);
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
    this._lastFocusedElement = document.activeElement;

    if (this.preventScroll) {
      this._disableScroll();
    }

    // Set focus trap
    requestAnimationFrame(() => {
      const focusable = this.shadowRoot.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
      }
    });

    this.dispatchEvent(
      new CustomEvent("open", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle modal close
   */
  _handleClose() {
    this._animating = true;

    if (this.preventScroll) {
      this._enableScroll();
    }

    // Restore focus
    if (this._lastFocusedElement) {
      this._lastFocusedElement.focus();
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
    if (
      this.open &&
      this.closeOnEscape &&
      !this.persistent &&
      e.key === "Escape"
    ) {
      this.open = false;
    }
  }

  /**
   * Handle focus trap
   * @param {KeyboardEvent} e
   */
  _handleFocusTrap(e) {
    if (!this.open || e.key !== "Tab") return;

    const focusableElements = this.shadowRoot.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * Handle overlay click
   * @param {MouseEvent} e
   */
  _handleOverlayClick(e) {
    if (
      this.open &&
      this.closeOnOverlayClick &&
      !this.persistent &&
      e.target === this.shadowRoot.querySelector(".modal-backdrop")
    ) {
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
    this.dispatchEvent(
      new CustomEvent("animation-end", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Disable body scroll
   */
  _disableScroll() {
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "var(--scrollbar-width)";
  }

  /**
   * Enable body scroll
   */
  _enableScroll() {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  render() {
    return html`
      <div
        class="modal-backdrop"
        @click=${this._handleOverlayClick}
        role="presentation"
      >
        <div
          class="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          @animationend=${this._handleAnimationEnd}
        >
          ${this.title || this.showClose
            ? html`
                <div class="modal-header">
                  ${this.title
                    ? html`<h2 id="modal-title" class="modal-title">
                        ${this.title}
                      </h2>`
                    : ""}
                  ${this.showClose
                    ? html`
                        <button
                          class="close-button"
                          @click=${() => (this.open = false)}
                          aria-label="Close modal"
                        >
                          <slot name="close-icon">×</slot>
                        </button>
                      `
                    : ""}
                </div>
              `
            : ""}

          <div class="modal-content">
            <slot></slot>
          </div>

          <slot name="footer">
            ${this._hasFooterSlot()
              ? html`<div class="modal-footer">
                  <slot name="footer"></slot>
                </div>`
              : ""}
          </slot>
        </div>
      </div>
    `;
  }

  /**
   * Check if footer slot has content
   */
  _hasFooterSlot() {
    const slot = this.shadowRoot?.querySelector('slot[name="footer"]');
    return slot?.assignedNodes().length > 0;
  }
}

customElements.define("neo-modal", Modal);

// Modal service for programmatic modal management
export class ModalService {
  constructor() {
    this._modals = new Set();
  }

  /**
   * Show a modal
   * @param {Object} options - Modal options
   * @returns {Promise} Resolves when modal is closed
   */
  show(options = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement("neo-modal");
      Object.assign(modal, options);

      const handleClose = () => {
        modal.removeEventListener("close", handleClose);
        modal.remove();
        this._modals.delete(modal);
        resolve();
      };

      modal.addEventListener("close", handleClose);
      document.body.appendChild(modal);
      this._modals.add(modal);

      // Open after a frame to ensure transitions work
      requestAnimationFrame(() => {
        modal.open = true;
      });
    });
  }

  /**
   * Show a confirmation dialog
   * @param {Object} options - Modal options
   * @returns {Promise<boolean>} Resolves with true if confirmed, false if cancelled
   */
  confirm(options = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement("neo-modal");
      const content = document.createElement("div");

      Object.assign(modal, {
        size: "sm",
        title: options.title || "Confirm",
        persistent: true,
        ...options,
      });

      content.innerHTML = options.message || "Are you sure?";

      const footer = document.createElement("div");
      footer.slot = "footer";

      const confirmButton = document.createElement("button");
      confirmButton.textContent = options.confirmText || "Confirm";
      confirmButton.className = "primary";
      confirmButton.onclick = () => {
        modal.open = false;
        resolve(true);
      };

      const cancelButton = document.createElement("button");
      cancelButton.textContent = options.cancelText || "Cancel";
      cancelButton.onclick = () => {
        modal.open = false;
        resolve(false);
      };

      footer.appendChild(cancelButton);
      footer.appendChild(confirmButton);

      modal.appendChild(content);
      modal.appendChild(footer);

      const handleClose = () => {
        modal.removeEventListener("close", handleClose);
        modal.remove();
        this._modals.delete(modal);
      };

      modal.addEventListener("close", handleClose);
      document.body.appendChild(modal);
      this._modals.add(modal);

      requestAnimationFrame(() => {
        modal.open = true;
      });
    });
  }

  /**
   * Close all open modals
   */
  closeAll() {
    this._modals.forEach((modal) => {
      modal.open = false;
    });
  }
}

export const modalService = new ModalService();
