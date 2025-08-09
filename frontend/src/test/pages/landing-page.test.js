import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LandingPage } from "../../pages/landing-page.js";

describe("Landing Page", () => {
  let container;
  let element;

  beforeEach(async () => {
    // Create a container for the page
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create the landing-page element
    element = document.createElement('landing-page');
    container.appendChild(element);
    
    // Wait for component to be fully rendered
    await element.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render landing page", async () => {
    expect(element).toBeTruthy();
    expect(element.shadowRoot).toBeTruthy();
  });
});
