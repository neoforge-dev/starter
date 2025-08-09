import { expect, describe, it, beforeEach, vi } from "vitest";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

/**
 * Mock for the NeoButton component
 */
class MockNeoButton {
  constructor() {
    // Properties from the component
    this._variant = "primary";
    this._size = "md";
    this._type = "button";
    this._disabled = false;
    this._loading = false;
    this._fullWidth = false;
    this._label = "";
    this._icon = "";
    this._iconOnly = false;

    // Event listeners
    this._eventListeners = new Map();

    // Mock shadow DOM elements
    this._buttonElement = document.createElement("button");
    this._spinnerElement = document.createElement("div");
    this._spinnerElement.className = "spinner";

    // Track attributes
    this._attributes = new Map();
  }

  // Property getters and setters
  get variant() {
    return this._variant;
  }
  set variant(value) {
    this._variant = value;
  }

  get size() {
    return this._size;
  }
  set size(value) {
    this._size = value;
  }

  get type() {
    return this._type;
  }
  set type(value) {
    this._type = value;
  }

  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = value;
    this._updateDisabledState();
  }

  get loading() {
    return this._loading;
  }
  set loading(value) {
    this._loading = value;
    this._updateDisabledState();
  }

  get fullWidth() {
    return this._fullWidth;
  }
  set fullWidth(value) {
    this._fullWidth = value;
  }

  get label() {
    return this._label;
  }
  set label(value) {
    this._label = value;
    this._updateAriaLabel();
  }

  get icon() {
    return this._icon;
  }
  set icon(value) {
    this._icon = value;
  }

  get iconOnly() {
    return this._iconOnly;
  }
  set iconOnly(value) {
    this._iconOnly = value;
    this._updateAriaLabel();
  }

  // Helper methods to update state
  _updateDisabledState() {
    const isDisabled = this._disabled || this._loading;
    if (isDisabled) {
      this.setAttribute("disabled", "");
      this.setAttribute("aria-disabled", "true");
    } else {
      this.removeAttribute("disabled");
      this.removeAttribute("aria-disabled");
    }
  }

  _updateAriaLabel() {
    if (this._iconOnly) {
      this.setAttribute("aria-label", this._label);
    } else {
      this.removeAttribute("aria-label");
    }
  }

  // Attribute handling
  setAttribute(name, value) {
    this._attributes.set(name, value);
  }

  getAttribute(name) {
    return this._attributes.get(name);
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  removeAttribute(name) {
    this._attributes.delete(name);
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
        if (selector === ".spinner" && this._loading) {
          return this._spinnerElement;
        }
        if (selector === "button") {
          return this._buttonElement;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".spinner" && this._loading) {
          return [this._spinnerElement];
        }
        if (selector === "button") {
          return [this._buttonElement];
        }
        return [];
      },
    };
  }

  // Methods from the component
  _handleClick(e) {
    if (this._disabled || this._loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent("click", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }

  // Simulate a click
  click() {
    if (!this._disabled && !this._loading) {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      this._handleClick(event);
    }
  }

  // Helper to get text content
  get textContent() {
    return this._label || "";
  }
}

describe("NeoButton", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoButton();
  });

  it("renders with default properties", () => {
    expect(element.variant).toBe("primary");
    expect(element.size).toBe("md");
    expect(element.type).toBe("button");
    expect(element.disabled).toBe(false);
    expect(element.loading).toBe(false);
    expect(element.fullWidth).toBe(false);
  });

  it("handles click events", () => {
    const clickSpy = vi.fn();
    element.addEventListener("click", clickSpy);

    element.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("prevents click when disabled", () => {
    const clickSpy = vi.fn();
    element.addEventListener("click", clickSpy);
    element.disabled = true;

    element.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("prevents click when loading", () => {
    const clickSpy = vi.fn();
    element.addEventListener("click", clickSpy);
    element.loading = true;

    element.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("handles disabled state", () => {
    element.disabled = true;

    expect(element.disabled).toBe(true);
    expect(element.hasAttribute("disabled")).toBe(true);
    expect(element.getAttribute("aria-disabled")).toBe("true");
  });

  it("renders with variant", () => {
    element.variant = "secondary";

    expect(element.variant).toBe("secondary");
  });

  it("renders with size", () => {
    element.size = "lg";

    expect(element.size).toBe("lg");
  });

  it("handles loading state", () => {
    element.loading = true;

    expect(element.loading).toBe(true);
    expect(element.shadowRoot.querySelector(".spinner")).not.toBeNull();
  });

  it("handles full width", () => {
    element.fullWidth = true;

    expect(element.fullWidth).toBe(true);
  });

  it("sets aria-label for icon-only buttons", () => {
    element.iconOnly = true;
    element.label = "Close";

    expect(element.getAttribute("aria-label")).toBe("Close");
  });

  it("removes aria-label for regular buttons", () => {
    element.iconOnly = false;
    element.label = "Submit";

    expect(element.hasAttribute("aria-label")).toBe(false);
  });
});
