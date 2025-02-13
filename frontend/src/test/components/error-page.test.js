import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/error/error-page.js";
import { AppError, ErrorType } from "../../services/error-service.js";

describe("ErrorPage", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-error-page></neo-error-page>`);
  });

  it("renders with default properties", () => {
    const container = element.shadowRoot.querySelector(".error-container");
    const icon = element.shadowRoot.querySelector(".error-icon");
    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");
    const actions = element.shadowRoot.querySelector(".error-actions");

    expect(container).to.exist;
    expect(icon).to.exist;
    expect(title).to.exist;
    expect(message).to.exist;
    expect(actions).to.exist;

    expect(title.textContent).to.equal("Error");
    expect(message.textContent).to.equal("An unknown error occurred");
    expect(icon.textContent.trim()).to.equal("error");
  });

  it("displays validation error correctly", async () => {
    const error = new AppError("Invalid form data", ErrorType.VALIDATION, {
      fields: ["username", "email"],
    });
    element.error = error;
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".error-icon");
    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");
    const details = element.shadowRoot.querySelector(".error-details");

    expect(icon.textContent.trim()).to.equal("warning");
    expect(title.textContent).to.equal("Validation Error");
    expect(message.textContent).to.equal(
      "Please check your input and try again"
    );
    expect(details).to.exist;
    expect(details.textContent).to.include("username");
    expect(details.textContent).to.include("email");
  });

  it("displays network error correctly", async () => {
    const error = new AppError("Failed to fetch", ErrorType.NETWORK, {
      url: "https://api.example.com/data",
    });
    element.error = error;
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".error-icon");
    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");

    expect(icon.textContent.trim()).to.equal("wifi_off");
    expect(title.textContent).to.equal("Network Error");
    expect(message.textContent).to.equal(
      "Unable to connect to the server. Please check your internet connection"
    );
  });

  it("displays auth error correctly", async () => {
    const error = new AppError("Token expired", ErrorType.AUTH, {
      expiredAt: new Date().toISOString(),
    });
    element.error = error;
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".error-icon");
    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");

    expect(icon.textContent.trim()).to.equal("lock");
    expect(title.textContent).to.equal("Authentication Error");
    expect(message.textContent).to.equal(
      "You need to be logged in to access this page"
    );
  });

  it("displays API error correctly", async () => {
    const error = new AppError("Resource not found", ErrorType.API, {
      status: 404,
      resource: "user",
    });
    element.error = error;
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".error-icon");
    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");

    expect(icon.textContent.trim()).to.equal("cloud_off");
    expect(title.textContent).to.equal("API Error");
    expect(message.textContent).to.equal("Resource not found");
  });

  it("handles retry action", async () => {
    // Mock window.location.reload
    const originalReload = window.location.reload;
    let reloadCalled = false;
    window.location.reload = () => {
      reloadCalled = true;
    };

    const retryButton = element.shadowRoot.querySelector(".button-primary");
    retryButton.click();

    expect(reloadCalled).to.be.true;

    // Restore original reload function
    window.location.reload = originalReload;
  });

  it("handles return home action", async () => {
    // Mock window.location.href
    const originalHref = window.location.href;
    Object.defineProperty(window.location, "href", {
      writable: true,
      value: originalHref,
    });

    const homeButton = element.shadowRoot.querySelector(".button-secondary");
    homeButton.click();

    expect(window.location.href).to.equal("/");

    // Restore original href
    window.location.href = originalHref;
  });

  it("displays error details when available", async () => {
    const error = new AppError("Complex error", ErrorType.UNKNOWN, {
      code: "ERR_001",
      timestamp: new Date().toISOString(),
      context: {
        module: "users",
        action: "create",
        params: { id: 123 },
      },
    });
    element.error = error;
    await element.updateComplete;

    const details = element.shadowRoot.querySelector(".error-details");
    expect(details).to.exist;
    expect(details.textContent).to.include("ERR_001");
    expect(details.textContent).to.include("users");
    expect(details.textContent).to.include("123");
  });

  it("hides error details when not available", async () => {
    const error = new AppError("Simple error");
    element.error = error;
    await element.updateComplete;

    const details = element.shadowRoot.querySelector(".error-details");
    expect(details).to.not.exist;
  });

  it("handles non-AppError errors", async () => {
    const error = new Error("Standard JS error");
    element.error = error;
    await element.updateComplete;

    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");

    expect(title.textContent).to.equal("Error");
    expect(message.textContent).to.equal("Standard JS error");
  });

  it("supports keyboard navigation", async () => {
    const buttons = element.shadowRoot.querySelectorAll("button");

    // Test focus handling
    buttons[0].focus();
    expect(document.activeElement).to.equal(buttons[0]);

    // Test keyboard interaction
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    buttons[0].dispatchEvent(event);

    // Focus should move to next button
    buttons[1].focus();
    expect(document.activeElement).to.equal(buttons[1]);
  });

  it("maintains accessibility attributes", () => {
    const container = element.shadowRoot.querySelector(".error-container");
    const buttons = element.shadowRoot.querySelectorAll("button");

    expect(container.getAttribute("role")).to.not.exist; // Container should not have a role
    expect(buttons[0].getAttribute("class")).to.include("button-primary");
    expect(buttons[1].getAttribute("class")).to.include("button-secondary");
  });
});
