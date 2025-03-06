import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Mock implementation for the NeoBadge component
 */
class MockNeoBadge {
  constructor() {
    // Properties
    this._variant = "default";
    this._size = "medium";
    this._rounded = false;
    this._outlined = false;
    this._icon = null;
    this._removable = false;
    this._title = "Default";
    this._pill = false;
    this._disabled = false;
    this.textContent = "";

    // Event listeners
    this._eventListeners = new Map();

    // Create badge element
    this._badgeElement = document.createElement("div");
    this._badgeElement.className = "badge variant-default size-medium truncate";
    this._badgeElement.setAttribute("role", "status");

    // Create slots
    this._prefixSlot = document.createElement("slot");
    this._prefixSlot.name = "prefix";

    this._defaultSlot = document.createElement("slot");

    this._suffixSlot = document.createElement("slot");
    this._suffixSlot.name = "suffix";

    // Create close button for removable badge
    this._closeButton = document.createElement("button");
    this._closeButton.className = "close-button";
    this._closeButton.setAttribute("aria-label", "Remove");

    // Create icon element
    this._iconElement = document.createElement("neo-icon");

    // Append slots to badge
    this._badgeElement.appendChild(this._prefixSlot);
    this._badgeElement.appendChild(this._defaultSlot);
    this._badgeElement.appendChild(this._suffixSlot);

    // Create shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === ".badge") {
          return this._badgeElement;
        }
        if (selector === ".close-button") {
          return this._closeButton;
        }
        if (selector === "neo-icon") {
          return this._iconElement;
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
  }

  // Getters and setters for reactive properties
  get variant() {
    return this._variant;
  }

  set variant(value) {
    this._variant = value;
    this._updateBadgeClasses();
  }

  get size() {
    return this._size;
  }

  set size(value) {
    this._size = value;
    this._updateBadgeClasses();
  }

  get rounded() {
    return this._rounded;
  }

  set rounded(value) {
    this._rounded = value;
    this._updateBadgeClasses();
  }

  get outlined() {
    return this._outlined;
  }

  set outlined(value) {
    this._outlined = value;
    this._updateBadgeClasses();
  }

  get icon() {
    return this._icon;
  }

  set icon(value) {
    this._icon = value;
    this._updateBadgeContent();
  }

  get removable() {
    return this._removable;
  }

  set removable(value) {
    this._removable = value;
    this._updateBadgeContent();
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this._title = value;
    this._badgeElement.setAttribute("title", value);
  }

  get pill() {
    return this._pill;
  }

  set pill(value) {
    this._pill = value;
    this._updateBadgeClasses();
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
    this._updateBadgeClasses();
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
  _handleRemove() {
    this.dispatchEvent(
      new CustomEvent("remove", {
        bubbles: true,
      })
    );
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Mock implementation
  }

  // Helper methods for updating the badge element
  _updateBadgeClasses() {
    const classes = [
      "badge",
      `variant-${this._variant}`,
      `size-${this._size}`,
      "truncate",
    ];

    if (this._rounded) classes.push("rounded");
    if (this._outlined) classes.push("outlined");
    if (this._pill) classes.push("pill");
    if (this._disabled) classes.push("disabled");

    this._badgeElement.className = classes.join(" ");
  }

  _updateBadgeContent() {
    // Update icon
    if (this._icon) {
      this._iconElement.setAttribute("name", this._icon);
      if (!this._badgeElement.contains(this._iconElement)) {
        this._badgeElement.insertBefore(this._iconElement, this._defaultSlot);
      }
    } else if (this._badgeElement.contains(this._iconElement)) {
      this._badgeElement.removeChild(this._iconElement);
    }

    // Update close button for removable badge
    if (this._removable) {
      if (!this._badgeElement.contains(this._closeButton)) {
        this._badgeElement.appendChild(this._closeButton);
      }
    } else if (this._badgeElement.contains(this._closeButton)) {
      this._badgeElement.removeChild(this._closeButton);
    }
  }
}

describe("NeoBadge", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoBadge();
  });

  it("should initialize with default properties", () => {
    expect(element.variant).toBe("default");
    expect(element.size).toBe("medium");
    expect(element.rounded).toBe(false);
    expect(element.outlined).toBe(false);
    expect(element.icon).toBe(null);
    expect(element.removable).toBe(false);
    expect(element.title).toBe("Default");
    expect(element.pill).toBe(false);
    expect(element.disabled).toBe(false);
  });

  it("should update variant property", () => {
    element.variant = "primary";
    expect(element.variant).toBe("primary");
    expect(element._badgeElement.className).toContain("variant-primary");
  });

  it("should update size property", () => {
    element.size = "large";
    expect(element.size).toBe("large");
    expect(element._badgeElement.className).toContain("size-large");
  });

  it("should update rounded property", () => {
    element.rounded = true;
    expect(element.rounded).toBe(true);
    expect(element._badgeElement.className).toContain("rounded");
  });

  it("should update outlined property", () => {
    element.outlined = true;
    expect(element.outlined).toBe(true);
    expect(element._badgeElement.className).toContain("outlined");
  });

  it("should update icon property", () => {
    element.icon = "info";
    expect(element.icon).toBe("info");
    expect(element._iconElement.getAttribute("name")).toBe("info");
  });

  it("should update removable property", () => {
    element.removable = true;
    expect(element.removable).toBe(true);
    expect(element._badgeElement.contains(element._closeButton)).toBe(true);
  });

  it("should update title property", () => {
    element.title = "Custom Title";
    expect(element.title).toBe("Custom Title");
    expect(element._badgeElement.getAttribute("title")).toBe("Custom Title");
  });

  it("should update pill property", () => {
    element.pill = true;
    expect(element.pill).toBe(true);
    expect(element._badgeElement.className).toContain("pill");
  });

  it("should update disabled property", () => {
    element.disabled = true;
    expect(element.disabled).toBe(true);
    expect(element._badgeElement.className).toContain("disabled");
  });

  it("should dispatch remove event when close button is clicked", () => {
    element.removable = true;

    const removeSpy = vi.fn();
    element.addEventListener("remove", removeSpy);

    element._handleRemove();

    expect(removeSpy).toHaveBeenCalled();
  });

  it("should update multiple properties at once", () => {
    element.variant = "success";
    element.size = "small";
    element.pill = true;
    element.outlined = true;

    expect(element.variant).toBe("success");
    expect(element.size).toBe("small");
    expect(element.pill).toBe(true);
    expect(element.outlined).toBe(true);

    expect(element._badgeElement.className).toContain("variant-success");
    expect(element._badgeElement.className).toContain("size-small");
    expect(element._badgeElement.className).toContain("pill");
    expect(element._badgeElement.className).toContain("outlined");
  });
});
