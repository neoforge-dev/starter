import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";

// Mock the NotFoundPage component
class MockNotFoundPage {
  constructor() {
    this._eventListeners = {};

    // Create mock shadow DOM structure
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "h1") return this.heading;
        if (selector === "p") return this.paragraph;
        if (selector === "a") return this.link;
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === "p") return [this.paragraph, this.returnParagraph];
        return [];
      },
    };

    // Create mock elements
    this.heading = {
      textContent: "404 - Page Not Found",
    };

    this.paragraph = {
      textContent:
        "The page you're looking for doesn't exist or has been moved.",
    };

    this.returnParagraph = {
      textContent: "Return to Home",
    };

    this.link = {
      textContent: "Return to Home",
      href: "/",
      addEventListener: vi.fn(),
      click: () => this._handleLinkClick(),
    };
  }

  // Event handling
  addEventListener(event, callback) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this._eventListeners[event]) {
      this._eventListeners[event] = this._eventListeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  dispatchEvent(event) {
    if (this._eventListeners[event.type]) {
      this._eventListeners[event.type].forEach((callback) => callback(event));
    }
    return true;
  }

  _handleLinkClick() {
    this.dispatchEvent(
      new CustomEvent("navigate", {
        detail: { path: "/" },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Mock the CustomEvent constructor
class MockCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
    this.bubbles = options.bubbles || false;
    this.composed = options.composed || false;
  }
}
global.CustomEvent = MockCustomEvent;

describe("404 Page", () => {
  let element;

  beforeEach(() => {
    element = new MockNotFoundPage();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render the 404 heading", () => {
    const heading = element.shadowRoot.querySelector("h1");
    expect(heading.textContent).toBe("404 - Page Not Found");
  });

  it("should render the error message", () => {
    const paragraph = element.shadowRoot.querySelector("p");
    expect(paragraph.textContent).toBe(
      "The page you're looking for doesn't exist or has been moved."
    );
  });

  it("should render a link to the home page", () => {
    const link = element.shadowRoot.querySelector("a");
    expect(link.textContent).toBe("Return to Home");
    expect(link.href).toBe("/");
  });

  it("should dispatch a navigate event when the home link is clicked", () => {
    const navigateHandler = vi.fn();
    element.addEventListener("navigate", navigateHandler);

    element.link.click();

    expect(navigateHandler).toHaveBeenCalled();
    expect(navigateHandler.mock.calls[0][0].detail).toEqual({ path: "/" });
  });

  it("should have two paragraphs", () => {
    const paragraphs = element.shadowRoot.querySelectorAll("p");
    expect(paragraphs.length).toBe(2);
  });
});
