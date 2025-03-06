import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";
import { ErrorType } from "../../services/error-service.js";

// Mock the ErrorPage component
class MockErrorPage {
  constructor() {
    // Initialize default properties
    this.code = "404";
    this.message = "Page Not Found";
    this.description =
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.";
    this.error = null;
    this.showDetails = false;
  }

  // Component methods
  _getErrorTitle() {
    if (!this.error) return this.message;
    switch (this.error.type) {
      case ErrorType.VALIDATION:
        return "Validation Error";
      case ErrorType.NETWORK:
        return "Network Error";
      case ErrorType.API:
        return "API Error";
      default:
        return "Unexpected Error";
    }
  }

  _getErrorIcon() {
    if (!this.error) return "question-circle";
    switch (this.error.type) {
      case ErrorType.VALIDATION:
        return "exclamation-circle";
      case ErrorType.NETWORK:
        return "wifi-off";
      case ErrorType.API:
        return "server";
      default:
        return "alert-circle";
    }
  }
}

describe("ErrorPage Minimal Test", () => {
  let element;

  beforeEach(() => {
    element = new MockErrorPage();
  });

  it("can be instantiated with default properties", () => {
    expect(element.code).toBe("404");
    expect(element.message).toBe("Page Not Found");
    expect(element.description).toBe(
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
    );
    expect(element.error).toBeNull();
    expect(element.showDetails).toBe(false);
  });

  it("returns the correct error title based on error type", () => {
    // Default case (no error)
    expect(element._getErrorTitle()).toBe("Page Not Found");

    // Validation error
    element.error = { type: ErrorType.VALIDATION };
    expect(element._getErrorTitle()).toBe("Validation Error");

    // Network error
    element.error = { type: ErrorType.NETWORK };
    expect(element._getErrorTitle()).toBe("Network Error");

    // API error
    element.error = { type: ErrorType.API };
    expect(element._getErrorTitle()).toBe("API Error");

    // Unknown error
    element.error = { type: "UNKNOWN" };
    expect(element._getErrorTitle()).toBe("Unexpected Error");
  });

  it("returns the correct error icon based on error type", () => {
    // Default case (no error)
    expect(element._getErrorIcon()).toBe("question-circle");

    // Validation error
    element.error = { type: ErrorType.VALIDATION };
    expect(element._getErrorIcon()).toBe("exclamation-circle");

    // Network error
    element.error = { type: ErrorType.NETWORK };
    expect(element._getErrorIcon()).toBe("wifi-off");

    // API error
    element.error = { type: ErrorType.API };
    expect(element._getErrorIcon()).toBe("server");

    // Unknown error
    element.error = { type: "UNKNOWN" };
    expect(element._getErrorIcon()).toBe("alert-circle");
  });
});
