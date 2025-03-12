import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Mock implementation for the Modal Component
 */
class MockNeoModal {
  constructor() {
    // Properties
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

    // Set up event handlers
    this._handleEscape = this._handleEscape.bind(this);
    this._handleOverlayClick = this._handleOverlayClick.bind(this);

    // Track attributes
    this._attributes = new Map();

    // Mock document body methods for scroll prevention
    this._originalBodyOverflow = document.body.style.overflow;
  }

  // Property getters and setters
  get open() {
    return this._open;
  }

  set open(value) {
    this._open = value;
    if (value) {
      this._disableScroll();
      this._overlay.classList.add("open");
      this._modal.classList.add("open");
    } else {
      this._enableScroll();
      this._overlay.classList.remove("open");
      this._modal.classList.remove("open");
    }
  }

  // Event handling methods
  addEventListener(eventName, callback) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, []);
    }
    this._eventListeners.get(eventName).push(callback);
  }

  removeEventListener(eventName, callback) {
    if (this._eventListeners.has(eventName)) {
      const listeners = this._eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type) || [];
    listeners.forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }

  // Component methods
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

  close() {
    this._animating = true;
    this._modal.classList.add("animating-out");

    // Simulate animation end
    setTimeout(() => {
      this._open = false;
      this._animating = false;
      this._modal.classList.remove("open");
      this._overlay.classList.remove("open");
      this.dispatchEvent(
        new CustomEvent("neo-close", {
          bubbles: true,
          composed: true,
        })
      );
    }, 200); // Match the animation duration
  }

  // Mock shadow DOM
  get shadowRoot() {
    return {
      querySelector: (selector) => {
        if (selector === ".modal-overlay") return this._overlay;
        if (selector === ".modal") return this._modal;
        return null;
      },
    };
  }

  // For testing purposes
  get updateComplete() {
    return Promise.resolve(true);
  }
}

describe("Modal Component", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoModal();
    document.addEventListener("keydown", element._handleEscape);
  });

  it("should initialize with default properties", () => {
    expect(element.open).toBe(false);
  });

  it("should update open property", () => {
    element.open = true;
    expect(element.open).toBe(true);
    expect(element._overlay.classList.contains("open")).toBe(true);
    expect(element._modal.classList.contains("open")).toBe(true);
  });

  it("should close when escape key is pressed", () => {
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

  it("should prevent body scrolling when open", () => {
    const originalOverflow = document.body.style.overflow;

    element.open = true;
    expect(document.body.style.overflow).toBe("hidden");

    element.open = false;
    expect(document.body.style.overflow).toBe(originalOverflow);
  });
});
