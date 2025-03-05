import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import { TestUtils } from "../setup.mjs";
import { waitForComponents } from "../setup.mjs";
import "../../../src/components/error-page.js";
import { AppError, ErrorType } from "../../services/error-service.js";

describe("ErrorPage", () => {
  let element;

  beforeEach(async () => {
    try {
      // Wait for components to be registered
      await waitForComponents();

      element = await TestUtils.fixture(
        TestUtils.html`<neo-error-page></neo-error-page>`
      );
      await TestUtils.waitForComponent(element);
    } catch (error) {
      console.error("Failed to setup test:", error);
      throw error;
    }
  });

  afterEach(() => {
    if (element) {
      element.remove();
    }
  });

  describe("Rendering", () => {
    it("renders with default properties", async () => {
      expect(element.errorCode).toBe("404");
      expect(element.errorMessage).toBe("Page Not Found");
      expect(element.errorDescription).toBe(
        "The page you are looking for does not exist."
      );
      expect(element.showHomeButton).toBe(true);
    });

    it("renders error code correctly", async () => {
      element.errorCode = "500";
      await element.updateComplete;

      const codeElement = TestUtils.queryComponent(element, ".error-code");
      expect(codeElement.textContent.trim()).toBe("500");
    });

    it("renders error message correctly", async () => {
      element.errorMessage = "Server Error";
      await element.updateComplete;

      const messageElement = TestUtils.queryComponent(
        element,
        ".error-message"
      );
      expect(messageElement.textContent.trim()).toBe("Server Error");
    });

    it("renders error description correctly", async () => {
      element.errorDescription = "Something went wrong on our end.";
      await element.updateComplete;

      const descriptionElement = TestUtils.queryComponent(
        element,
        ".error-description"
      );
      expect(descriptionElement.textContent.trim()).toBe(
        "Something went wrong on our end."
      );
    });

    it("renders home button correctly", async () => {
      const homeButton = TestUtils.queryComponent(element, ".home-button");
      expect(homeButton).toBeTruthy();
      expect(homeButton.textContent.trim()).toBe("Go Home");
    });

    it("renders validation error correctly", async () => {
      element.errorCode = "400";
      element.errorMessage = "Bad Request";
      element.errorDescription = "Invalid input provided.";
      await element.updateComplete;

      const codeElement = TestUtils.queryComponent(element, ".error-code");
      const messageElement = TestUtils.queryComponent(
        element,
        ".error-message"
      );
      const descriptionElement = TestUtils.queryComponent(
        element,
        ".error-description"
      );

      expect(codeElement.textContent.trim()).toBe("400");
      expect(messageElement.textContent.trim()).toBe("Bad Request");
      expect(descriptionElement.textContent.trim()).toBe(
        "Invalid input provided."
      );
    });

    it("renders network error correctly", async () => {
      element.errorCode = "503";
      element.errorMessage = "Service Unavailable";
      element.errorDescription = "Please try again later.";
      await element.updateComplete;

      const codeElement = TestUtils.queryComponent(element, ".error-code");
      const messageElement = TestUtils.queryComponent(
        element,
        ".error-message"
      );
      const descriptionElement = TestUtils.queryComponent(
        element,
        ".error-description"
      );

      expect(codeElement.textContent.trim()).toBe("503");
      expect(messageElement.textContent.trim()).toBe("Service Unavailable");
      expect(descriptionElement.textContent.trim()).toBe(
        "Please try again later."
      );
    });

    it("renders API error correctly", async () => {
      element.errorCode = "500";
      element.errorMessage = "Internal Server Error";
      element.errorDescription = "An unexpected error occurred.";
      await element.updateComplete;

      const codeElement = TestUtils.queryComponent(element, ".error-code");
      const messageElement = TestUtils.queryComponent(
        element,
        ".error-message"
      );
      const descriptionElement = TestUtils.queryComponent(
        element,
        ".error-description"
      );

      expect(codeElement.textContent.trim()).toBe("500");
      expect(messageElement.textContent.trim()).toBe("Internal Server Error");
      expect(descriptionElement.textContent.trim()).toBe(
        "An unexpected error occurred."
      );
    });

    it("renders unknown error correctly", async () => {
      element.errorCode = "999";
      element.errorMessage = "Unknown Error";
      element.errorDescription = "An unexpected error occurred.";
      await element.updateComplete;

      const codeElement = TestUtils.queryComponent(element, ".error-code");
      const messageElement = TestUtils.queryComponent(
        element,
        ".error-message"
      );
      const descriptionElement = TestUtils.queryComponent(
        element,
        ".error-description"
      );

      expect(codeElement.textContent.trim()).toBe("999");
      expect(messageElement.textContent.trim()).toBe("Unknown Error");
      expect(descriptionElement.textContent.trim()).toBe(
        "An unexpected error occurred."
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", async () => {
      const container = TestUtils.queryComponent(element, ".error-container");
      expect(container.getAttribute("role")).toBe("alert");
      expect(container.getAttribute("aria-live")).toBe("polite");
    });

    it("has proper heading structure", async () => {
      const heading = TestUtils.queryComponent(element, ".error-message");
      expect(heading.tagName.toLowerCase()).toBe("h1");
    });
  });

  describe("User Interaction", () => {
    it("handles home button click", async () => {
      let clicked = false;
      element.addEventListener("home", () => (clicked = true));

      const homeButton = TestUtils.queryComponent(element, ".home-button");
      homeButton.click();

      expect(clicked).toBe(true);
    });

    it("handles retry button click", async () => {
      element.showRetryButton = true;
      await element.updateComplete;

      let clicked = false;
      element.addEventListener("retry", () => (clicked = true));

      const retryButton = TestUtils.queryComponent(element, ".retry-button");
      retryButton.click();

      expect(clicked).toBe(true);
    });

    it("handles contact support button click", async () => {
      element.showContactSupport = true;
      await element.updateComplete;

      let clicked = false;
      element.addEventListener("contact", () => (clicked = true));

      const contactButton = TestUtils.queryComponent(
        element,
        ".contact-button"
      );
      contactButton.click();

      expect(clicked).toBe(true);
    });
  });

  describe("Responsive Design", () => {
    it("adapts to different screen sizes", async () => {
      const container = TestUtils.queryComponent(element, ".error-container");
      expect(container.classList.contains("responsive")).toBe(true);
    });

    it("maintains readability on small screens", async () => {
      const message = TestUtils.queryComponent(element, ".error-message");
      expect(message.classList.contains("responsive-text")).toBe(true);
    });
  });

  describe("Animation", () => {
    it("applies fade-in animation", async () => {
      const container = TestUtils.queryComponent(element, ".error-container");
      expect(container.classList.contains("fade-in")).toBe(true);
    });

    it("applies slide-up animation", async () => {
      const content = TestUtils.queryComponent(element, ".error-content");
      expect(content.classList.contains("slide-up")).toBe(true);
    });
  });
});
