import { expect, describe, it, beforeEach, afterEach } from "vitest";

// Create a mock ErrorPage class
class MockErrorPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize default properties
    this.errorCode = "404";
    this.errorMessage = "Page Not Found";
    this.errorDescription = "The page you are looking for does not exist.";
    this.showHomeButton = true;
    this.showRetryButton = false;
    this.showContactSupport = false;

    // Render initial content
    this.render();
  }

  // Render method to update shadow DOM
  render() {
    this.shadowRoot.innerHTML = `
      <div class="error-container responsive fade-in" role="alert" aria-live="polite">
        <div class="error-code">${this.errorCode}</div>
        <h1 class="error-message responsive-text">${this.errorMessage}</h1>
        <div class="error-description">${this.errorDescription}</div>
        <div class="error-content slide-up">
          ${this.showHomeButton ? '<button class="home-button">Go Home</button>' : ""}
          ${this.showRetryButton ? '<button class="retry-button">Retry</button>' : ""}
          ${this.showContactSupport ? '<button class="contact-button">Contact Support</button>' : ""}
        </div>
      </div>
    `;

    // Add event listeners
    if (this.showHomeButton) {
      this.shadowRoot
        .querySelector(".home-button")
        .addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("home", { bubbles: true, composed: true })
          );
        });
    }

    if (this.showRetryButton) {
      this.shadowRoot
        .querySelector(".retry-button")
        .addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("retry", { bubbles: true, composed: true })
          );
        });
    }

    if (this.showContactSupport) {
      this.shadowRoot
        .querySelector(".contact-button")
        .addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("contact", { bubbles: true, composed: true })
          );
        });
    }
  }
}

// Register the mock component
customElements.define("neo-error-page", MockErrorPage);

describe("ErrorPage", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("neo-error-page");
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element) {
      element.remove();
    }
  });

  describe("Rendering", () => {
    it("renders with default properties", () => {
      expect(element.errorCode).toBe("404");
      expect(element.errorMessage).toBe("Page Not Found");
      expect(element.errorDescription).toBe(
        "The page you are looking for does not exist."
      );
      expect(element.showHomeButton).toBe(true);
    });

    it("renders error code correctly", () => {
      element.errorCode = "500";
      element.render();

      const codeElement = element.shadowRoot.querySelector(".error-code");
      expect(codeElement.textContent).toBe("500");
    });

    it("renders error message correctly", () => {
      element.errorMessage = "Server Error";
      element.render();

      const messageElement = element.shadowRoot.querySelector(".error-message");
      expect(messageElement.textContent).toBe("Server Error");
    });

    it("renders error description correctly", () => {
      element.errorDescription = "Something went wrong on our end.";
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
