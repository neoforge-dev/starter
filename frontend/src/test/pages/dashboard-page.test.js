import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Simple vitest test for Dashboard Page
describe("Dashboard Page", () => {
  let container;
  let element;

  beforeEach(async () => {
    // Create a container for the page
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create the dashboard-page element
    element = document.createElement('dashboard-page');
    container.appendChild(element);

    // Wait for component to be fully rendered
    await element.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render dashboard page", async () => {
    expect(element).toBeTruthy();
    expect(element.shadowRoot).toBeTruthy();
  });
});
