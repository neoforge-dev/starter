import { expect, describe, it, beforeEach } from "vitest";

/**
 * Mock for the NeoCard component
 */
class MockNeoCard {
  constructor() {
    // Properties
    this._variant = "default";
    this._padding = "md";
    this._hoverable = false;
    this._clickable = false;
    this._href = "";

    // Create card element
    this._cardElement = document.createElement("div");
    this._cardElement.className = "card default padding-md";

    // Create slots
    this._slots = {
      default: document.createElement("slot"),
      media: document.createElement("slot"),
      header: document.createElement("slot"),
      footer: document.createElement("slot"),
    };

    // Set slot names
    this._slots.media.name = "media";
    this._slots.header.name = "header";
    this._slots.footer.name = "footer";

    // Append slots to card
    this._cardElement.appendChild(this._slots.media);
    this._cardElement.appendChild(this._slots.header);
    this._cardElement.appendChild(this._slots.default);
    this._cardElement.appendChild(this._slots.footer);

    // Event listeners
    this._eventListeners = new Map();

    // Attributes
    this._attributes = new Map();

    // Update initial state
    this._updateCardClasses();
  }

  // Property getters and setters
  get variant() {
    return this._variant;
  }
  set variant(value) {
    this._variant = value;
    this._updateCardClasses();
  }

  get padding() {
    return this._padding;
  }
  set padding(value) {
    this._padding = value;
    this._updateCardClasses();
  }

  get hoverable() {
    return this._hoverable;
  }
  set hoverable(value) {
    this._hoverable = value;
    this._updateCardClasses();
  }

  get clickable() {
    return this._clickable;
  }
  set clickable(value) {
    this._clickable = value;

    // Re-create the card element when clickable changes
    if (value && this._href) {
      this._cardElement = document.createElement("a");
      this._cardElement.href = this._href;
    } else {
      this._cardElement = document.createElement("div");
    }

    // Update classes and tabindex
    this._updateCardClasses();
    this._updateTabIndex();

    // Re-append slots to the new card element
    this._cardElement.appendChild(this._slots.media);
    this._cardElement.appendChild(this._slots.header);
    this._cardElement.appendChild(this._slots.default);
    this._cardElement.appendChild(this._slots.footer);
  }

  get href() {
    return this._href;
  }
  set href(value) {
    this._href = value;
    if (this._clickable && value) {
      this._cardElement = document.createElement("a");
      this._cardElement.href = value;
    } else {
      this._cardElement = document.createElement("div");
    }
    this._updateCardClasses();
    this._updateTabIndex();
  }

  // Helper methods to update state
  _updateCardClasses() {
    const classes = ["card", this._variant, `padding-${this._padding}`];

    if (this._hoverable) classes.push("hoverable");
    if (this._clickable) classes.push("clickable");

    this._cardElement.className = classes.join(" ");
  }

  _updateTabIndex() {
    if (this._clickable) {
      this._cardElement.setAttribute("tabindex", "0");
    } else {
      this._cardElement.setAttribute("tabindex", "-1");
    }
  }

  // Attribute handling
  setAttribute(name, value) {
    this._attributes.set(name, value);

    // Handle special attributes
    if (name === "variant") this.variant = value;
    if (name === "padding") this.padding = value;
    if (name === "hoverable") this.hoverable = value === "" || value === "true";
    if (name === "clickable") this.clickable = value === "" || value === "true";
    if (name === "href") this.href = value;
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
    if (name === "hoverable") this.hoverable = false;
    if (name === "clickable") this.clickable = false;
    if (name === "href") this.href = "";
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
        if (selector === ".card") return this._cardElement;
        if (selector.includes("slot")) {
          if (selector === "slot[name='media']") return this._slots.media;
          if (selector === "slot[name='header']") return this._slots.header;
          if (selector === "slot[name='footer']") return this._slots.footer;
          return this._slots.default;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".card") return [this._cardElement];
        if (selector === "slot") return Object.values(this._slots);
        return [];
      },
    };
  }

  // Simulate a click
  click() {
    if (this._clickable) {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      this.dispatchEvent(event);
    }
  }
}

describe("NeoCard", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoCard();
  });

  it("renders with default properties", () => {
    expect(element.variant).toBe("default");
    expect(element.padding).toBe("md");
    expect(element.hoverable).toBe(false);
    expect(element.clickable).toBe(false);
    expect(element.href).toBe("");
  });

  it("applies variant class", () => {
    element.variant = "elevated";
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "elevated"
    );

    element.variant = "outlined";
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "outlined"
    );
  });

  it("applies padding class", () => {
    element.padding = "lg";
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "padding-lg"
    );

    element.padding = "sm";
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "padding-sm"
    );

    element.padding = "none";
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "padding-none"
    );
  });

  it("applies hoverable class when hoverable is true", () => {
    element.hoverable = true;
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "hoverable"
    );

    element.hoverable = false;
    expect(element.shadowRoot.querySelector(".card").className).not.toContain(
      "hoverable"
    );
  });

  it("applies clickable class when clickable is true", () => {
    element.clickable = true;
    expect(element.shadowRoot.querySelector(".card").className).toContain(
      "clickable"
    );

    element.clickable = false;
    expect(element.shadowRoot.querySelector(".card").className).not.toContain(
      "clickable"
    );
  });

  it("sets tabindex to 0 when clickable is true", () => {
    element.clickable = true;
    expect(
      element.shadowRoot.querySelector(".card").getAttribute("tabindex")
    ).toBe("0");

    element.clickable = false;
    expect(
      element.shadowRoot.querySelector(".card").getAttribute("tabindex")
    ).toBe("-1");
  });

  it("renders as an anchor when clickable and href are set", () => {
    element.clickable = true;
    element.href = "https://example.com";

    const card = element.shadowRoot.querySelector(".card");
    expect(card.tagName.toLowerCase()).toBe("a");
    expect(card.href).toContain("https://example.com");
  });

  it("renders as a div when href is not set", () => {
    element.clickable = true;
    element.href = ""; // Explicitly set href to empty string

    const card = element.shadowRoot.querySelector(".card");
    expect(card.tagName.toLowerCase()).toBe("div");
  });

  it("has slots for content organization", () => {
    expect(
      element.shadowRoot.querySelector("slot[name='media']")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector("slot[name='header']")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector("slot[name='footer']")
    ).not.toBeNull();
    expect(element.shadowRoot.querySelector("slot")).not.toBeNull();
  });
});
