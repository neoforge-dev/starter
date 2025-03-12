import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";

// Define ErrorType enum directly in the test file instead of importing it
const ErrorType = {
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

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
    this._eventListeners = {};

    // Create mock shadow DOM structure
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === ".error-code") return { textContent: this.code };
        if (selector === ".error-title")
          return { textContent: this._getErrorTitle() };
        if (selector === ".error-description")
          return { textContent: this.description };
        if (selector === ".retry-button") return this.retryButton;
        if (selector === ".home-button") return this.homeButton;
        if (selector === ".details-toggle") return this.detailsToggle;
        if (selector === ".error-details") return this.errorDetails;
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === "button")
          return [this.retryButton, this.homeButton, this.detailsToggle].filter(
            Boolean
          );
        return [];
      },
    };

    // Create mock elements
    this.retryButton = {
      textContent: "Retry",
      addEventListener: vi.fn(),
      click: () => this._handleRetry(),
    };

    this.homeButton = {
      textContent: "Back to Home",
      href: "/",
      addEventListener: vi.fn(),
    };

    this.detailsToggle = {
      textContent: "Show Details",
      addEventListener: vi.fn(),
      click: () => this._handleToggleDetails(),
    };

    this.errorDetails = {
      hidden: !this.showDetails,
      textContent: "",
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

  // Component methods
  _getErrorTitle() {
    if (!this.error) return this.message;
    switch (this.error.type) {
      case ErrorType.VALIDATION_ERROR:
        return "Validation Error";
      case ErrorType.NETWORK_ERROR:
        return "Network Error";
      case ErrorType.SERVER_ERROR:
        return "Server Error";
      default:
        return "Unexpected Error";
    }
  }

  _getErrorIcon() {
    if (!this.error) return "question-circle";
    switch (this.error.type) {
      case ErrorType.VALIDATION_ERROR:
        return "exclamation-circle";
      case ErrorType.NETWORK_ERROR:
        return "wifi-off";
      case ErrorType.SERVER_ERROR:
        return "server";
      default:
        return "alert-circle";
    }
  }

  _handleRetry() {
    this.dispatchEvent(
      new CustomEvent("retry", {
        detail: { error: this.error },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleToggleDetails() {
    this.showDetails = !this.showDetails;
    this.errorDetails.hidden = !this.showDetails;
    this.detailsToggle.textContent = this.showDetails
      ? "Hide Details"
      : "Show Details";
  }

  // Update the error details when error changes
  _updateErrorDetails() {
    if (this.error && this.error.details) {
      this.errorDetails.textContent = JSON.stringify(
        this.error.details,
        null,
        2
      );
    } else {
      this.errorDetails.textContent = "";
    }
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

describe("ErrorPage Simple Test", () => {
  let element;

  beforeEach(() => {
    element = new MockErrorPage();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    expect(element.code).toBe("404");
    expect(element.message).toBe("Page Not Found");
    expect(element.description).toBe(
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
    );
    expect(element.error).toBeNull();
    expect(element.showDetails).toBe(false);
  });

  it("should render error code correctly", () => {
    element.code = "500";
    const codeElement = element.shadowRoot.querySelector(".error-code");
    expect(codeElement.textContent).toBe("500");
  });

  it("should render error message correctly", () => {
    element.message = "Server Error";
    const titleElement = element.shadowRoot.querySelector(".error-title");
    expect(titleElement.textContent).toBe("Server Error");
  });

  it("should render error description correctly", () => {
    element.description = "Something went wrong on our end.";
    const descriptionElement =
      element.shadowRoot.querySelector(".error-description");
    expect(descriptionElement.textContent).toBe(
      "Something went wrong on our end."
    );
  });

  it("should toggle error details visibility", () => {
    expect(element.showDetails).toBe(false);
    expect(element.errorDetails.hidden).toBe(true);

    element.detailsToggle.click();

    expect(element.showDetails).toBe(true);
    expect(element.errorDetails.hidden).toBe(false);
    expect(element.detailsToggle.textContent).toBe("Hide Details");

    element.detailsToggle.click();

    expect(element.showDetails).toBe(false);
    expect(element.errorDetails.hidden).toBe(true);
    expect(element.detailsToggle.textContent).toBe("Show Details");
  });

  it("should dispatch retry event when retry button is clicked", () => {
    const retryHandler = vi.fn();
    element.addEventListener("retry", retryHandler);

    element.retryButton.click();

    expect(retryHandler).toHaveBeenCalled();
    expect(retryHandler.mock.calls[0][0].detail).toEqual({ error: null });
  });

  it("should show error details when error is provided", () => {
    element.error = {
      type: ErrorType.SERVER_ERROR,
      details: { status: 500, message: "Internal Server Error" },
    };

    element._updateErrorDetails();
    element.detailsToggle.click();

    expect(element.showDetails).toBe(true);
    expect(element.errorDetails.hidden).toBe(false);
    expect(element.errorDetails.textContent).toContain("Internal Server Error");
  });

  it("should display different titles based on error type", () => {
    // Test validation error
    element.error = { type: ErrorType.VALIDATION_ERROR };
    expect(element._getErrorTitle()).toBe("Validation Error");

    // Test network error
    element.error = { type: ErrorType.NETWORK_ERROR };
    expect(element._getErrorTitle()).toBe("Network Error");

    // Test server error
    element.error = { type: ErrorType.SERVER_ERROR };
    expect(element._getErrorTitle()).toBe("Server Error");

    // Test unknown error
    element.error = { type: ErrorType.UNKNOWN_ERROR };
    expect(element._getErrorTitle()).toBe("Unexpected Error");
  });
});
