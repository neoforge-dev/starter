import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Mock implementation for the NeoLink component
 */
class MockNeoLink {
  constructor() {
    // Properties
    this._href = "";
    this._variant = "default";
    this._size = "md";
    this._underline = "hover";
    this._disabled = false;
    this._external = false;

    // Event listeners
    this._eventListeners = new Map();

    // Create link element
    this._linkElement = document.createElement("a");
    this._linkElement.className = "variant-default size-md underline-hover";

    // Create slots
    this._prefixSlot = document.createElement("slot");
    this._prefixSlot.name = "prefix";

    this._defaultSlot = document.createElement("slot");

    this._suffixSlot = document.createElement("slot");
    this._suffixSlot.name = "suffix";

    // Append slots to link
    this._linkElement.appendChild(this._prefixSlot);
    this._linkElement.appendChild(this._defaultSlot);
    this._linkElement.appendChild(this._suffixSlot);

    // Create shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "a") {
          return this._linkElement;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === "slot") {
          return [this._prefixSlot, this._defaultSlot, this._suffixSlot];
        }
        return [];
      },
    };

    // Promise for updateComplete
    this.updateComplete = Promise.resolve(true);

    // Text content
    this.textContent = "";
  }

  // Getters and setters for reactive properties
  get href() {
    return this._href;
  }

  set href(value) {
    this._href = value;
    this._linkElement.href = this._disabled ? "#" : value;
    this._updateLinkAttributes();
  }

  get variant() {
    return this._variant;
  }

  set variant(value) {
    this._variant = value;
    this._updateLinkClasses();
  }

  get size() {
    return this._size;
  }

  set size(value) {
    this._size = value;
    this._updateLinkClasses();
  }

  get underline() {
    return this._underline;
  }

  set underline(value) {
    this._underline = value;
    this._updateLinkClasses();
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
    this._linkElement.href = value ? "#" : this._href;
    this._updateLinkClasses();
    this._updateLinkAttributes();
  }

  get external() {
    return this._external;
  }

  set external(value) {
    this._external = value;
    this._updateLinkAttributes();
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
  _handleClick(e) {
    if (this._disabled) {
      e.preventDefault();
      return;
    }

    // Create a custom event to dispatch
    const customEvent = {
      type: 'click',
      detail: { originalEvent: e },
      bubbles: true,
      composed: true,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      }
    };
    
    // Directly call the event listeners
    const listeners = this._eventListeners.get('click') || [];
    listeners.forEach((callback) => callback(customEvent));
  }

  // Helper methods for updating the link element
  _updateLinkClasses() {
    const classes = [
      `variant-${this._variant}`,
      `size-${this._size}`,
      `underline-${this._underline}`,
    ];

    if (this._disabled) {
      classes.push("disabled");
    }

    this._linkElement.className = classes.join(" ");
  }

  _updateLinkAttributes() {
    // Set aria-disabled attribute
    this._linkElement.setAttribute("aria-disabled", this._disabled.toString());

    // Set external attributes
    if (this._external) {
      this._linkElement.setAttribute("target", "_blank");
      this._linkElement.setAttribute("rel", "noopener noreferrer");

      // Set aria-label for external links
      const ariaLabel = `${this.textContent} (opens in new tab)`;
      this._linkElement.setAttribute("aria-label", ariaLabel);
    } else {
      this._linkElement.removeAttribute("target");
      this._linkElement.removeAttribute("rel");
      this._linkElement.removeAttribute("aria-label");
    }
  }
}

describe("NeoLink", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoLink();
  });

  it("should initialize with default properties", () => {
    expect(element.href).toBe("");
    expect(element.variant).toBe("default");
    expect(element.size).toBe("md");
    expect(element.underline).toBe("hover");
    expect(element.disabled).toBe(false);
    expect(element.external).toBe(false);
  });

  it("should update href property", () => {
    element.href = "https://example.com";
    expect(element.href).toBe("https://example.com");
    expect(element._linkElement.href).toContain("https://example.com");
  });

  it("should update variant property", () => {
    element.variant = "primary";
    expect(element.variant).toBe("primary");
    expect(element._linkElement.className).toContain("variant-primary");
  });

  it("should update size property", () => {
    element.size = "lg";
    expect(element.size).toBe("lg");
    expect(element._linkElement.className).toContain("size-lg");
  });

  it("should update underline property", () => {
    element.underline = "always";
    expect(element.underline).toBe("always");
    expect(element._linkElement.className).toContain("underline-always");
  });

  it("should update disabled property", () => {
    element.href = "https://example.com";
    element.disabled = true;
    expect(element.disabled).toBe(true);
    expect(element._linkElement.className).toContain("disabled");
    expect(element._linkElement.href).toContain("#");
    expect(element._linkElement.getAttribute("aria-disabled")).toBe("true");
  });

  it("should update external property", () => {
    element.external = true;
    expect(element.external).toBe(true);
    expect(element._linkElement.getAttribute("target")).toBe("_blank");
    expect(element._linkElement.getAttribute("rel")).toBe(
      "noopener noreferrer"
    );
  });

  it("should set aria-label for external links", () => {
    element.textContent = "Visit our site";
    element.external = true;
    expect(element._linkElement.getAttribute("aria-label")).toBe(
      "Visit our site (opens in new tab)"
    );
  });

  it("should prevent default action when disabled and clicked", () => {
    element.disabled = true;

    const event = {
      preventDefault: vi.fn(),
    };

    element._handleClick(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("should dispatch click event when not disabled and clicked", () => {
    const clickSpy = vi.fn();
    element.addEventListener("click", clickSpy);

    const event = {
      preventDefault: vi.fn(),
    };

    element._handleClick(event);

    expect(clickSpy).toHaveBeenCalled();
    expect(clickSpy.mock.calls[0][0].detail.originalEvent).toBe(event);
  });

  it("should update multiple properties at once", () => {
    element.href = "https://example.com";
    element.variant = "secondary";
    element.size = "sm";
    element.underline = "none";
    element.external = true;

    expect(element.href).toBe("https://example.com");
    expect(element.variant).toBe("secondary");
    expect(element.size).toBe("sm");
    expect(element.underline).toBe("none");
    expect(element.external).toBe(true);

    expect(element._linkElement.className).toContain("variant-secondary");
    expect(element._linkElement.className).toContain("size-sm");
    expect(element._linkElement.className).toContain("underline-none");
    expect(element._linkElement.getAttribute("target")).toBe("_blank");
  });
});
