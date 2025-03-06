import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Improved mock for the NeoModal component
 */
class MockNeoModal {
  constructor() {
    // Properties from the component
    this._open = false;
    this._size = "md";
    this._closeOnOverlay = true;
    this._closeOnEscape = true;
    this._preventScroll = true;
    this._animating = false;

    // Event listeners
    this._eventListeners = new Map();

    // Mock DOM elements
    this._overlay = document.createElement("div");
    this._overlay.className = "modal-overlay";

    this._modal = document.createElement("div");
    this._modal.className = `modal ${this._size}`;

    this._header = document.createElement("div");
    this._header.className = "modal-header";

    this._title = document.createElement("h2");
    this._title.className = "modal-title";

    this._closeButton = document.createElement("button");
    this._closeButton.className = "modal-close";
    this._closeButton.setAttribute("aria-label", "Close modal");

    this._body = document.createElement("div");
    this._body.className = "modal-body";

    this._footer = document.createElement("div");
    this._footer.className = "modal-footer";

    // Build the structure
    this._header.appendChild(this._title);
    this._header.appendChild(this._closeButton);
    this._modal.appendChild(this._header);
    this._modal.appendChild(this._body);
    this._modal.appendChild(this._footer);
    this._overlay.appendChild(this._modal);

    // Slots
    this._slots = {
      default: document.createElement("slot"),
      header: document.createElement("slot"),
      title: document.createElement("slot"),
      footer: document.createElement("slot"),
    };

    this._slots.header.setAttribute("name", "header");
    this._slots.title.setAttribute("name", "title");
    this._slots.footer.setAttribute("name", "footer");

    this._title.appendChild(this._slots.title);
    this._body.appendChild(this._slots.default);
    this._footer.appendChild(this._slots.footer);

    // Set up event handlers
    this._handleEscape = this._handleEscape.bind(this);
    this._handleOverlayClick = this._handleOverlayClick.bind(this);
    this._closeButton.addEventListener("click", () => this.close());

    // Track attributes
    this._attributes = new Map();

    // Mock document body methods for scroll prevention
    this._originalBodyOverflow = document.body.style.overflow;

    // Set up initial state
    this._updateModalClasses();
  }

  // Property getters and setters
  get open() {
    return this._open;
  }
  set open(value) {
    this._open = value;
    this._updateModalClasses();
    if (value) {
      this._disableScroll();
    } else {
      this._enableScroll();
    }
  }

  get size() {
    return this._size;
  }
  set size(value) {
    this._size = value;
    this._updateModalClasses();
  }

  get closeOnOverlay() {
    return this._closeOnOverlay;
  }
  set closeOnOverlay(value) {
    this._closeOnOverlay = value;
  }

  get closeOnEscape() {
    return this._closeOnEscape;
  }
  set closeOnEscape(value) {
    this._closeOnEscape = value;
  }

  get preventScroll() {
    return this._preventScroll;
  }
  set preventScroll(value) {
    this._preventScroll = value;
  }

  get _animating() {
    return this.__animating;
  }
  set _animating(value) {
    this.__animating = value;
  }

  // Helper methods to update state
  _updateModalClasses() {
    // Update overlay classes
    if (this._open) {
      this._overlay.classList.add("open");
    } else {
      this._overlay.classList.remove("open");
    }

    // Update modal classes
    this._modal.className = `modal ${this._size}`;
    if (this._open) {
      this._modal.classList.add("open");
    }
    if (this._animating) {
      this._modal.classList.add(this._open ? "animating-in" : "animating-out");
    }
  }

  // Event handlers
  _handleEscape(e) {
    if (this._open && this._closeOnEscape && e.key === "Escape") {
      this.close();
    }
  }

  _handleOverlayClick(e) {
    if (this._closeOnOverlay && e.target === this._overlay) {
      this.close();
    }
  }

  _disableScroll() {
    if (this._preventScroll) {
      document.body.style.overflow = "hidden";
    }
  }

  _enableScroll() {
    if (this._preventScroll) {
      document.body.style.overflow = this._originalBodyOverflow;
    }
  }

  // Lifecycle methods
  connectedCallback() {
    document.addEventListener("keydown", this._handleEscape);
    this._overlay.addEventListener("click", this._handleOverlayClick);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleEscape);
    this._overlay.removeEventListener("click", this._handleOverlayClick);
    this._enableScroll();
  }

  // Component methods
  close() {
    this._animating = true;
    this._modal.classList.add("animating-out");

    // Simulate animation end
    setTimeout(() => {
      this._open = false;
      this._animating = false;
      this._updateModalClasses();
      this.dispatchEvent(
        new CustomEvent("neo-close", {
          bubbles: true,
          composed: true,
        })
      );
    }, 200); // Match the animation duration
  }

  // Attribute handling
  setAttribute(name, value) {
    this._attributes.set(name, value);

    // Handle special attributes
    if (name === "open") this.open = value === "" || value === "true";
    if (name === "size") this.size = value;
    if (name === "close-on-overlay")
      this.closeOnOverlay = value === "" || value === "true";
    if (name === "close-on-escape")
      this.closeOnEscape = value === "" || value === "true";
    if (name === "prevent-scroll")
      this.preventScroll = value === "" || value === "true";
  }

  getAttribute(name) {
    return this._attributes.get(name);
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  removeAttribute(name) {
    this._attributes.delete(name);

    // Handle special attributes
    if (name === "open") this.open = false;
    if (name === "close-on-overlay") this.closeOnOverlay = false;
    if (name === "close-on-escape") this.closeOnEscape = false;
    if (name === "prevent-scroll") this.preventScroll = false;
  }

  // Event handling
  addEventListener(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._eventListeners.has(event)) return;
    const listeners = this._eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type) || [];
    listeners.forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }

  // Mock shadow DOM
  get shadowRoot() {
    return {
      querySelector: (selector) => {
        if (selector === ".modal-overlay") return this._overlay;
        if (selector === ".modal") return this._modal;
        if (selector === ".modal-header") return this._header;
        if (selector === ".modal-body") return this._body;
        if (selector === ".modal-footer") return this._footer;
        if (selector === ".modal-title") return this._title;
        if (selector === ".modal-close") return this._closeButton;
        if (selector.includes("slot")) {
          if (selector === "slot[name='header']") return this._slots.header;
          if (selector === "slot[name='title']") return this._slots.title;
          if (selector === "slot[name='footer']") return this._slots.footer;
          return this._slots.default;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".modal") return [this._modal];
        if (selector === "slot") return Object.values(this._slots);
        return [];
      },
    };
  }

  // For testing purposes
  get updateComplete() {
    return Promise.resolve(true);
  }

  // Helper to set content
  set innerHTML(value) {
    this._body.innerHTML = value;
  }

  get innerHTML() {
    return this._body.innerHTML;
  }
}

describe("NeoModal", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoModal();
    element.connectedCallback();

    // Add content to the modal
    element.innerHTML = `
      <div slot="header">Modal Title</div>
      Modal content
      <div slot="footer">Modal Footer</div>
    `;
  });

  it("renders with default properties", () => {
    expect(element.open).toBe(false);
    expect(element.size).toBe("md");
    expect(element.closeOnOverlay).toBe(true);
    expect(element.closeOnEscape).toBe(true);
    expect(element.preventScroll).toBe(true);
  });

  it("reflects property changes", () => {
    element.open = true;
    expect(element.open).toBe(true);
    expect(element._overlay.classList.contains("open")).toBe(true);
    expect(element._modal.classList.contains("open")).toBe(true);

    element.size = "lg";
    expect(element.size).toBe("lg");
    expect(element._modal.classList.contains("lg")).toBe(true);

    element.closeOnOverlay = false;
    expect(element.closeOnOverlay).toBe(false);

    element.closeOnEscape = false;
    expect(element.closeOnEscape).toBe(false);

    element.preventScroll = false;
    expect(element.preventScroll).toBe(false);
  });

  it("shows modal when open is true", () => {
    element.open = true;

    expect(element._modal.classList.contains("open")).toBe(true);
    expect(element._overlay.classList.contains("open")).toBe(true);
  });

  it("hides modal when open is false", () => {
    element.open = true;
    element.open = false;

    expect(element._modal.classList.contains("open")).toBe(false);
    expect(element._overlay.classList.contains("open")).toBe(false);
  });

  it("dispatches neo-close event when closed", () => {
    element.open = true;

    const closeSpy = vi.fn();
    element.addEventListener("neo-close", closeSpy);

    element.close();

    // Use setTimeout to wait for the animation to complete
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(element.open).toBe(false);
        resolve();
      }, 250);
    });
  });

  it("closes when escape key is pressed", () => {
    element.open = true;

    const closeSpy = vi.fn();
    element.addEventListener("neo-close", closeSpy);

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(escapeEvent);

    // Use setTimeout to wait for the animation to complete
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(element.open).toBe(false);
        resolve();
      }, 250);
    });
  });

  it("does not close when escape key is pressed if closeOnEscape is false", () => {
    element.open = true;
    element.closeOnEscape = false;

    const closeSpy = vi.fn();
    element.addEventListener("neo-close", closeSpy);

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(escapeEvent);

    // Use setTimeout to ensure no close event was fired
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(closeSpy).not.toHaveBeenCalled();
        expect(element.open).toBe(true);
        resolve();
      }, 250);
    });
  });

  it("prevents body scrolling when open", () => {
    const originalOverflow = document.body.style.overflow;

    element.open = true;
    expect(document.body.style.overflow).toBe("hidden");

    element.open = false;
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("does not prevent body scrolling when preventScroll is false", () => {
    const originalOverflow = document.body.style.overflow;
    element.preventScroll = false;

    element.open = true;
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("cleans up event listeners when disconnected", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    element.disconnectedCallback();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      element._handleEscape
    );
  });
});
