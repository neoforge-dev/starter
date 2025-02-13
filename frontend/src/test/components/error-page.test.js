import { expect, fixture, html, oneEvent } from "@open-wc/testing";
import { ErrorPage } from "../../components/error-page.js";
import { AppError, ErrorType } from "../../services/error-service.js";

describe("ErrorPage", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-error-page></neo-error-page>`);
  });

  describe("Rendering", () => {
    it("renders with default properties", async () => {
      expect(element).to.be.instanceOf(ErrorPage);
      expect(element.shadowRoot).to.exist;
      expect(element.error).to.be.null;
    });

    it("renders validation error correctly", async () => {
      const error = new AppError({
        type: ErrorType.VALIDATION,
        message: "Invalid email format",
      });
      element.error = error;
      await element.updateComplete;

      const title = element.shadowRoot.querySelector(".error-title");
      const message = element.shadowRoot.querySelector(".error-message");
      const icon = element.shadowRoot.querySelector(".error-icon");

      expect(title.textContent).to.include("Validation Error");
      expect(message.textContent).to.include("Invalid email format");
      expect(icon.innerHTML).to.include("exclamation-circle");
    });

    it("renders network error correctly", async () => {
      const error = new AppError({
        type: ErrorType.NETWORK,
        message: "Failed to fetch",
      });
      element.error = error;
      await element.updateComplete;

      const title = element.shadowRoot.querySelector(".error-title");
      const message = element.shadowRoot.querySelector(".error-message");
      const icon = element.shadowRoot.querySelector(".error-icon");

      expect(title.textContent).to.include("Network Error");
      expect(message.textContent).to.include(
        "Network error. Please check your connection."
      );
      expect(icon.innerHTML).to.include("wifi-off");
    });

    it("renders API error correctly", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message: "Resource not found",
        details: { status: 404 },
      });
      element.error = error;
      await element.updateComplete;

      const title = element.shadowRoot.querySelector(".error-title");
      const message = element.shadowRoot.querySelector(".error-message");
      const details = element.shadowRoot.querySelector(".error-details");

      expect(title.textContent).to.include("API Error");
      expect(message.textContent).to.include("Resource not found");
      expect(details.textContent).to.include("404");
    });

    it("renders unknown error correctly", async () => {
      const error = new AppError({
        type: ErrorType.UNKNOWN,
        message: "Something went wrong",
      });
      element.error = error;
      await element.updateComplete;

      const title = element.shadowRoot.querySelector(".error-title");
      const message = element.shadowRoot.querySelector(".error-message");

      expect(title.textContent).to.include("Unexpected Error");
      expect(message.textContent).to.include("Something went wrong");
    });
  });

  describe("Accessibility", () => {
    it("is accessible", async () => {
      await expect(element).to.be.accessible();
    });

    it("has proper ARIA attributes", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
      });
      element.error = error;
      await element.updateComplete;

      const errorRegion = element.shadowRoot.querySelector("[role='alert']");
      expect(errorRegion).to.exist;
      expect(errorRegion.getAttribute("aria-live")).to.equal("polite");
    });

    it("maintains focus management", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
      });
      element.error = error;
      await element.updateComplete;

      const retryButton = element.shadowRoot.querySelector(".retry-button");
      const homeButton = element.shadowRoot.querySelector(".home-button");

      expect(document.activeElement).to.equal(retryButton);
      homeButton.focus();
      expect(document.activeElement).to.equal(homeButton);
    });
  });

  describe("User Interaction", () => {
    it("emits retry event when retry button is clicked", async () => {
      const error = new AppError({
        type: ErrorType.NETWORK,
        message: "Connection failed",
      });
      element.error = error;
      await element.updateComplete;

      const retryButton = element.shadowRoot.querySelector(".retry-button");
      setTimeout(() => retryButton.click());
      const { detail } = await oneEvent(element, "retry");

      expect(detail.error).to.equal(error);
    });

    it("navigates home when home button is clicked", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
      });
      element.error = error;
      await element.updateComplete;

      const homeButton = element.shadowRoot.querySelector(".home-button");
      const navigateSpy = vi.spyOn(window.history, "pushState");

      homeButton.click();
      expect(navigateSpy).to.have.been.calledWith({}, "", "/");
    });

    it("shows technical details when toggle is clicked", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
        details: { status: 500, stack: "Error stack" },
      });
      element.error = error;
      await element.updateComplete;

      const toggleButton = element.shadowRoot.querySelector(".details-toggle");
      const detailsSection =
        element.shadowRoot.querySelector(".technical-details");

      expect(detailsSection.hasAttribute("hidden")).to.be.true;

      toggleButton.click();
      await element.updateComplete;

      expect(detailsSection.hasAttribute("hidden")).to.be.false;
      expect(detailsSection.textContent).to.include("Error stack");
    });
  });

  describe("Responsive Design", () => {
    it("adjusts layout for mobile screens", async () => {
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      const originalMatches = mediaQuery.matches;
      Object.defineProperty(mediaQuery, "matches", { value: true });

      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
      });
      element.error = error;
      await element.updateComplete;

      const container = element.shadowRoot.querySelector(".error-container");
      const styles = window.getComputedStyle(container);

      expect(styles.flexDirection).to.equal("column");
      expect(styles.padding).to.equal("1rem");

      Object.defineProperty(mediaQuery, "matches", {
        value: originalMatches,
      });
    });

    it("maintains readability on small screens", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message:
          "A very long error message that should wrap properly on mobile devices",
      });
      element.error = error;
      await element.updateComplete;

      const message = element.shadowRoot.querySelector(".error-message");
      const styles = window.getComputedStyle(message);

      expect(styles.wordBreak).to.equal("break-word");
      expect(parseInt(styles.maxWidth)).to.be.lessThan(500);
    });
  });

  describe("Animation", () => {
    it("applies entrance animation", async () => {
      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
      });
      element.error = error;
      await element.updateComplete;

      const container = element.shadowRoot.querySelector(".error-container");
      expect(container.classList.contains("animate-in")).to.be.true;

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(container.classList.contains("animate-in")).to.be.false;
    });

    it("respects reduced motion preferences", async () => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const originalMatches = mediaQuery.matches;
      Object.defineProperty(mediaQuery, "matches", { value: true });

      const error = new AppError({
        type: ErrorType.API,
        message: "Test error",
      });
      element.error = error;
      await element.updateComplete;

      const container = element.shadowRoot.querySelector(".error-container");
      const styles = window.getComputedStyle(container);

      expect(styles.animation).to.equal("none");

      Object.defineProperty(mediaQuery, "matches", {
        value: originalMatches,
      });
    });
  });
});
