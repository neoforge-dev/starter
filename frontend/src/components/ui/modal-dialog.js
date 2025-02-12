import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

export class ModalDialog extends LitElement {
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
        display: none;
        width: 100vw;
        height: 100vh;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
      }
      :host([open]) {
        display: flex;
      }
      .modal-content {
        background: var(--surface-color);
        padding: var(--spacing-xl);
        border-radius: var(--radius-md);
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
        position: relative;
      }
      .close-button {
        position: absolute;
        top: var(--spacing-md);
        right: var(--spacing-md);
        background: transparent;
        border: none;
        font-size: 1.5rem;
        color: var(--text-color);
        cursor: pointer;
      }
    `,
  ];

  render() {
    return html`
      <div class="modal-content">
        <slot></slot>
      </div>
      <button class="close-button" @click=${this._close}>&times;</button>
    `;
  }

  _close() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("modal-closed", { bubbles: true, composed: true })
    );
  }
}

customElements.define("modal-dialog", ModalDialog);
