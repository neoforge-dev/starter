import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Modal component
 * @element neo-modal
 */
export class NeoModal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: var(--z-modal);
        display: none;
      }

      :host([open]) {
        display: block;
      }

      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        cursor: pointer;
      }

      .modal-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--surface-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
      }

      .modal-header {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .modal-content {
        padding: var(--spacing-md);
      }

      .modal-footer {
        padding: var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }
    `,
  ];

  constructor() {
    super();
    this.open = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  _handleKeyDown(e) {
    if (e.key === "Escape" && this.open) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("modal-close"));
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("open")) {
      if (this.open) {
        this.dispatchEvent(new CustomEvent("modal-open"));
      } else {
        this.dispatchEvent(new CustomEvent("modal-close"));
      }
    }
  }

  render() {
    return html`
      <div
        class="modal-backdrop"
        @click=${() => {
          this.open = false;
        }}
      >
        <div class="modal-container" @click=${(e) => e.stopPropagation()}>
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

customElements.define("neo-modal", NeoModal);

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
