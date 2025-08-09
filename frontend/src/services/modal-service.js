import "../components/molecules/modal/modal.js"; // Import the actual neo-modal component
import "../components/atoms/button/button.js"; // Import neo-button used in confirm
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js"; // Needed if we create template literals for content/footer

/**
 * Modal service for programmatic modal management
 */
export class ModalService {
  constructor() {
    this._modals = new Set();
    this._ensureContainer();
  }

  _ensureContainer() {
    if (!document.getElementById("modal-service-container")) {
      const container = document.createElement("div");
      container.id = "modal-service-container";
      // Optional: Add some styles for positioning if needed globally
      // container.style.position = 'fixed';
      // container.style.zIndex = '1001'; // Ensure it's above modal overlays
      document.body.appendChild(container);
    }
  }

  _getContainer() {
    this._ensureContainer();
    return document.getElementById("modal-service-container");
  }

  /**
   * Show a modal
   * @param {Object} options - Modal options (passed as props to neo-modal)
   * @param {TemplateResult | Node | string} content - Content for the default slot
   * @param {TemplateResult | Node | string} [header] - Content for the header slot
   * @param {TemplateResult | Node | string} [footer] - Content for the footer slot
   * @returns {Promise} Resolves when modal is closed, returns the neo-modal element
   */
  show({ options = {}, content, header, footer } = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement("neo-modal");

      // Assign options to modal properties
      Object.assign(modal, options);

      // Append slotted content
      if (header) {
        const headerDiv = document.createElement("div");
        headerDiv.slot = "header";
        this._appendContent(headerDiv, header);
        modal.appendChild(headerDiv);
      }
      if (content) {
        // Default slot doesn't strictly need a container div
        this._appendContent(modal, content);
      }
      if (footer) {
        const footerDiv = document.createElement("div");
        footerDiv.slot = "footer";
        this._appendContent(footerDiv, footer);
        modal.appendChild(footerDiv);
      }

      const handleClose = () => {
        // Use the component's close event
        modal.removeEventListener("neo-close", handleClose);
        modal.remove();
        this._modals.delete(modal);
        resolve(modal); // Resolve with the element
      };

      modal.addEventListener("neo-close", handleClose);

      this._getContainer().appendChild(modal);
      this._modals.add(modal);

      // Use component's open method or property
      requestAnimationFrame(() => {
        modal.open = true; // Assuming 'open' property triggers the display
      });
    });
  }

  /**
   * Show a confirmation dialog
   * @param {Object} options - Options: message, title, confirmText, cancelText, size, etc.
   * @returns {Promise<boolean>} Resolves with true if confirmed, false if cancelled
   */
  confirm(options = {}) {
    return new Promise((resolve) => {
      const message = options.message || "Are you sure?";
      const title = options.title; // Optional title

      const content = document.createElement("p");
      content.textContent = message;

      // Create footer buttons using neo-button
      const footerContainer = document.createElement("div");
      footerContainer.style.display = "flex";
      footerContainer.style.gap = "8px"; // Add some spacing
      footerContainer.style.justifyContent = "flex-end";

      const confirmButton = document.createElement("neo-button");
      confirmButton.textContent = options.confirmText || "Confirm";
      confirmButton.variant = "primary";
      confirmButton.onclick = () => {
        modalInstance.close(); // Use the instance method to close
        resolve(true);
      };

      const cancelButton = document.createElement("neo-button");
      cancelButton.textContent = options.cancelText || "Cancel";
      cancelButton.variant = "secondary"; // Or default
      cancelButton.onclick = () => {
        modalInstance.close();
        resolve(false);
      };

      footerContainer.appendChild(cancelButton);
      footerContainer.appendChild(confirmButton);

      // Show the modal using the service's own show method
      let modalInstance;
      this.show({
        options: {
          size: options.size || "sm",
          closeOnEscape: false, // Typically prevent escape for confirms
          closeOnOverlay: false,
          ...(options.modalOptions || {}), // Allow overriding modal props
        },
        header: title ? html`<h3 style="margin: 0;">${title}</h3>` : null,
        content: content,
        footer: footerContainer,
      }).then((instance) => {
        modalInstance = instance; // Get the instance when shown
        // Handle case where modal is closed externally (e.g., via closeAll)
        const checkClosed = () => {
          if (!this._modals.has(modalInstance)) {
            resolve(false); // Resolve as cancelled if closed externally
          }
        };
        // Need a slight delay to attach listener after potential immediate close
        setTimeout(
          () => modalInstance.addEventListener("neo-close", checkClosed),
          0
        );
      });

      // The promise resolution is handled by the button clicks or external close
    });
  }

  /**
   * Appends content (string, Node, TemplateResult) to an element.
   * Handles Lit TemplateResults specifically.
   */
  _appendContent(parent, content) {
    if (typeof content === "string") {
      parent.appendChild(document.createTextNode(content));
    } else if (content instanceof Node) {
      parent.appendChild(content);
    } else if (
      content &&
      typeof content === "object" &&
      content.strings &&
      content.values
    ) {
      // Check if it looks like a Lit TemplateResult
      // Render Lit template results into the parent
      render(content, parent);
    } else if (content) {
      console.warn("Unsupported content type for modal slot:", content);
    }
  }

  /**
   * Close all open modals managed by this service
   */
  closeAll() {
    // Iterate safely as closing modifies the set
    const modalsToClose = [...this._modals];
    modalsToClose.forEach((modal) => {
      if (modal.close) {
        modal.close(); // Use component's close method if available
      } else {
        modal.open = false; // Fallback to property
      }
    });
  }
}

// Export a singleton instance
export const modalService = new ModalService();
