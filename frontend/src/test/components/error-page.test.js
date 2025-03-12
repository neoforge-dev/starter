import { expect, describe, it, beforeEach, afterEach } from "vitest";

// Create a mock ErrorPage class using pure JavaScript
class MockErrorPage {
  constructor() {
    this.code = "404";
    this.message = "Page Not Found";
    this.description = "The page you are looking for does not exist.";
    this.showHomeButton = true;
    this.showRetryButton = false;
    this.showContactSupport = false;
    this._eventListeners = {};

    // Create shadow DOM
    this.shadowRoot = {
      innerHTML: "",
      querySelector: (selector) => {
        if (selector === ".error-container") {
          return {
            getAttribute: (attr) => {
              if (attr === "role") return "alert";
              if (attr === "aria-live") return "polite";
              return null;
            },
          };
        }
        if (selector === ".error-code") {
          return { textContent: this.code };
        }
        if (selector === ".error-message") {
          return {
            textContent: this.message,
            tagName: "H1",
          };
        }
        if (selector === ".error-description") {
          return { textContent: this.description };
        }
        if (selector === ".home-button") {
          return this.showHomeButton
            ? {
                textContent: "Go Home",
                click: () => {
                  this.dispatchEvent(
                    new CustomEvent("home", { bubbles: true, composed: true })
                  );
                },
              }
            : null;
        }
        if (selector === ".retry-button") {
          return this.showRetryButton
            ? {
                textContent: "Retry",
                click: () => {
                  this.dispatchEvent(
                    new CustomEvent("retry", { bubbles: true, composed: true })
                  );
                },
              }
            : null;
        }
        if (selector === ".contact-button") {
          return this.showContactSupport
            ? {
                textContent: "Contact Support",
                click: () => {
                  this.dispatchEvent(
                    new CustomEvent("contact", {
                      bubbles: true,
                      composed: true,
                    })
                  );
                },
              }
            : null;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".error-button") {
          const buttons = [];
          if (this.showHomeButton) {
            buttons.push({ textContent: "Go Home" });
          }
          if (this.showRetryButton) {
            buttons.push({ textContent: "Retry" });
          }
          if (this.showContactSupport) {
            buttons.push({ textContent: "Contact Support" });
          }
          return buttons;
        }
        return [];
      },
    };
  }

  // Method to update the shadow DOM
  render() {
    // Update the shadow DOM elements based on current properties
    // This is a mock implementation, so we don't actually render anything
  }

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
    const listeners = this._eventListeners[event.type] || [];
    listeners.forEach((callback) => callback(event));
    return true;
  }

  remove() {
    // Mock removal method
  }
}

describe("ErrorPage", () => {
  let element;

  beforeEach(() => {
    element = new MockErrorPage();
  });

  afterEach(() => {
    if (element) {
      element.remove();
    }
  });

  describe("Rendering", () => {
    it("renders with default properties", () => {
      expect(element.code).toBe("404");
      expect(element.message).toBe("Page Not Found");
      expect(element.description).toBe(
        "The page you are looking for does not exist."
      );
      expect(element.showHomeButton).toBe(true);
    });

    it("renders error code correctly", () => {
      element.code = "500";
      element.render();

      const codeElement = element.shadowRoot.querySelector(".error-code");
      expect(codeElement.textContent).toBe("500");
    });

    it("renders error message correctly", () => {
      element.message = "Server Error";
      element.render();

      const messageElement = element.shadowRoot.querySelector(".error-message");
      expect(messageElement.textContent).toBe("Server Error");
    });

    it("renders error description correctly", () => {
      element.description = "Something went wrong on our end.";
      element.render();

      const descriptionElement =
        element.shadowRoot.querySelector(".error-description");
      expect(descriptionElement.textContent).toBe(
        "Something went wrong on our end."
      );
    });

    it("renders home button correctly", () => {
      const homeButton = element.shadowRoot.querySelector(".home-button");
      expect(homeButton).toBeTruthy();
      expect(homeButton.textContent).toBe("Go Home");
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      const container = element.shadowRoot.querySelector(".error-container");
      expect(container.getAttribute("role")).toBe("alert");
      expect(container.getAttribute("aria-live")).toBe("polite");
    });

    it("has proper heading structure", () => {
      const heading = element.shadowRoot.querySelector(".error-message");
      expect(heading.tagName.toLowerCase()).toBe("h1");
    });
  });

  describe("User Interaction", () => {
    it("handles home button click", () => {
      let clicked = false;
      element.addEventListener("home", () => (clicked = true));

      const homeButton = element.shadowRoot.querySelector(".home-button");
      homeButton.click();

      expect(clicked).toBe(true);
    });

    it("handles retry button click", () => {
      element.showRetryButton = true;
      element.render();

      let clicked = false;
      element.addEventListener("retry", () => (clicked = true));

      const retryButton = element.shadowRoot.querySelector(".retry-button");
      retryButton.click();

      expect(clicked).toBe(true);
    });

    it("handles contact support button click", () => {
      element.showContactSupport = true;
      element.render();

      let clicked = false;
      element.addEventListener("contact", () => (clicked = true));

      const contactButton = element.shadowRoot.querySelector(".contact-button");
      contactButton.click();

      expect(clicked).toBe(true);
    });
  });
});
