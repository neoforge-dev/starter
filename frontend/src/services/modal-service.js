/**
 * Modal service for programmatic modal management
 */
class ModalService {
  constructor() {
    this.modals = new Map();
    this._scrollbarWidth = this._getScrollbarWidth();
  }

  /**
   * Show a modal
   * @param {Object} options Modal options
   * @param {string|HTMLElement} options.content Modal content (HTML string or element)
   * @param {string} [options.title] Modal title
   * @param {string} [options.size='md'] Modal size
   * @param {string} [options.position='center'] Modal position
   * @param {boolean} [options.closeOnEscape=true] Close on escape key
   * @param {boolean} [options.closeOnOverlayClick=true] Close on overlay click
   * @param {boolean} [options.preventScroll=true] Prevent body scroll
   * @param {Function} [options.onOpen] Open callback
   * @param {Function} [options.onClose] Close callback
   * @returns {HTMLElement} Modal element
   */
  show({
    content,
    title = "",
    size = "md",
    position = "center",
    closeOnEscape = true,
    closeOnOverlayClick = true,
    preventScroll = true,
    onOpen,
    onClose,
  } = {}) {
    // Create modal element
    const modal = document.createElement("neo-modal");
    const id = `modal-${Date.now()}`;

    // Set modal properties
    modal.size = size;
    modal.position = position;
    modal.closeOnEscape = closeOnEscape;
    modal.closeOnOverlayClick = closeOnOverlayClick;
    modal.preventScroll = preventScroll;

    // Add content
    if (typeof content === "string") {
      modal.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modal.appendChild(content);
    }

    // Add title if provided
    if (title) {
      const titleEl = document.createElement("h2");
      titleEl.textContent = title;
      titleEl.slot = "header";
      modal.appendChild(titleEl);
    }

    // Add event listeners
    if (onOpen) {
      modal.addEventListener("open", onOpen);
    }
    if (onClose) {
      modal.addEventListener("close", onClose);
    }

    // Add to document and track
    document.body.appendChild(modal);
    this.modals.set(id, modal);

    // Show modal
    requestAnimationFrame(() => {
      modal.open = true;
      if (preventScroll) {
        this._preventScroll();
      }
    });

    // Add cleanup on close
    modal.addEventListener(
      "close",
      () => {
        setTimeout(() => {
          modal.remove();
          this.modals.delete(id);
          if (this.modals.size === 0) {
            this._enableScroll();
          }
        }, 300);
      },
      { once: true }
    );

    return modal;
  }

  /**
   * Show a confirmation modal
   * @param {Object} options Confirmation options
   * @param {string} options.title Confirmation title
   * @param {string} options.message Confirmation message
   * @param {string} [options.confirmText='Confirm'] Confirm button text
   * @param {string} [options.cancelText='Cancel'] Cancel button text
   * @param {string} [options.confirmVariant='primary'] Confirm button variant
   * @param {string} [options.size='sm'] Modal size
   * @returns {Promise<boolean>} Resolves with true if confirmed, false if cancelled
   */
  confirm({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "primary",
    size = "sm",
  } = {}) {
    return new Promise((resolve) => {
      const content = document.createElement("div");

      // Add message
      const messageEl = document.createElement("p");
      messageEl.textContent = message;
      content.appendChild(messageEl);

      // Add buttons
      const footer = document.createElement("div");
      footer.slot = "footer";

      const cancelButton = document.createElement("neo-button");
      cancelButton.variant = "outline";
      cancelButton.textContent = cancelText;
      cancelButton.addEventListener("click", () => {
        modal.open = false;
        resolve(false);
      });

      const confirmButton = document.createElement("neo-button");
      confirmButton.variant = confirmVariant;
      confirmButton.textContent = confirmText;
      confirmButton.addEventListener("click", () => {
        modal.open = false;
        resolve(true);
      });

      footer.appendChild(cancelButton);
      footer.appendChild(confirmButton);
      content.appendChild(footer);

      // Show modal
      const modal = this.show({
        content,
        title,
        size,
        closeOnOverlayClick: false,
        onClose: () => resolve(false),
      });
    });
  }

  /**
   * Close all modals
   */
  closeAll() {
    this.modals.forEach((modal) => {
      modal.open = false;
    });
  }

  /**
   * Get scrollbar width
   * @private
   */
  _getScrollbarWidth() {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.remove();

    return scrollbarWidth;
  }

  /**
   * Prevent body scroll
   * @private
   */
  _preventScroll() {
    const hasScroll = document.body.scrollHeight > window.innerHeight;
    if (hasScroll) {
      document.body.style.paddingRight = `${this._scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
  }

  /**
   * Enable body scroll
   * @private
   */
  _enableScroll() {
    document.body.style.paddingRight = "";
    document.body.style.overflow = "";
  }
}

// Create singleton instance
const modal = new ModalService();
export default modal;
