import { 
  LitElement,
  html,
  css,
 } from 'lit';
import { baseStyles } from "../../styles/base.js";
import { registerComponent } from "../../base-component.js";

/**
 * Modal component for displaying content in a dialog overlay
 * @element neo-modal
 *
 * @prop {boolean} open - Whether the modal is open
 * @prop {string} size - Size of the modal (sm, md, lg, xl, full)
 * @prop {boolean} closeOnOverlay - Whether to close when clicking the overlay
 * @prop {boolean} closeOnEscape - Whether to close when pressing Escape
 * @prop {boolean} preventScroll - Whether to prevent body scrolling when open
 */
export class NeoModal extends LitElement {
  static get properties() {
    return {
      open: { type: Boolean, reflect: true },
      size: { type: String },
      closeOnOverlay: { type: Boolean },
      closeOnEscape: { type: Boolean },
      preventScroll: { type: Boolean },
      _animating: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: contents;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition:
            opacity 0.2s ease-in-out,
            visibility 0.2s ease-in-out;
        }

        .modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .modal {
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-height: calc(100vh - 32px);
          display: flex;
          flex-direction: column;
          transform: scale(0.95);
          opacity: 0;
          transition:
            transform 0.2s ease-in-out,
            opacity 0.2s ease-in-out;
        }

        .modal.open {
          transform: scale(1);
          opacity: 1;
        }

        /* Sizes */
        .modal.sm {
          width: 400px;
        }

        .modal.md {
          width: 600px;
        }

        .modal.lg {
          width: 800px;
        }

        .modal.xl {
          width: 1000px;
        }

        .modal.full {
          width: calc(100vw - 32px);
          height: calc(100vh - 32px);
        }

        /* Header */
        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .modal-close {
          padding: 8px;
          border: none;
          background: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: color 0.2s ease-in-out;
        }

        .modal-close:hover {
          color: var(--color-text);
        }

        /* Body */
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        /* Footer */
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        /* Animations */
        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(10px);
            opacity: 0;
          }
        }

        .modal.animating-in {
          animation: slideIn 0.2s ease-out forwards;
        }

        .modal.animating-out {
          animation: slideOut 0.2s ease-in forwards;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.open = false;
    this.size = "md";
    this.closeOnOverlay = true;
    this.closeOnEscape = true;
    this.preventScroll = true;
    this._animating = false;
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
        this._disableScroll();
      } else {
        this._enableScroll();
      }
    }
  }

  _handleEscape(e) {
    if (this.open && this.closeOnEscape && e.key === "Escape") {
      this.close();
    }
  }

  _handleOverlayClick(e) {
    if (this.closeOnOverlay && e.target === e.currentTarget) {
      this.close();
    }
  }

  _disableScroll() {
    if (this.preventScroll) {
      document.body.style.overflow = "hidden";
    }
  }

  _enableScroll() {
    if (this.preventScroll) {
      document.body.style.overflow = "";
    }
  }

  close() {
    this._animating = true;
    const modal = this.shadowRoot.querySelector(".modal");
    modal.classList.add("animating-out");

    modal.addEventListener(
      "animationend",
      () => {
        this.open = false;
        this._animating = false;
        this.dispatchEvent(
          new CustomEvent("neo-close", {
            bubbles: true,
            composed: true,
          })
        );
      },
      { once: true }
    );
  }

  render() {
    if (!this.open && !this._animating) return null;

    const overlayClasses = `modal-overlay ${this.open ? "open" : ""}`;
    const modalClasses = `
      modal
      ${this.size}
      ${this.open ? "open" : ""}
      ${this._animating ? "animating-in" : ""}
    `;

    return html`
      <div
        class=${overlayClasses}
        @click=${this._handleOverlayClick}
        role="dialog"
        aria-modal="true"
      >
        <div class=${modalClasses.trim()}>
          <div class="modal-header">
            <slot name="header">
              <h2 class="modal-title">
                <slot name="title">Modal Title</slot>
              </h2>
            </slot>
            <button
              class="modal-close"
              @click=${this.close}
              aria-label="Close modal"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the component
registerComponent("neo-modal", NeoModal);
