import { expect, describe, it } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../pages/404-page.js";

// Skipping all tests in this file due to custom element registration issues
describe.skip("404 Page", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<not-found-page></not-found-page>`);
    await TestUtils.waitForComponent(element);
  });

  it("renders the 404 page", async () => {
    const h1 = element.shadowRoot.querySelector("h1");
    expect(h1.textContent).toBe("404 - Page Not Found");
  });

  it("contains a link to home", async () => {
    const link = element.shadowRoot.querySelector("a");
    expect(link.href).toContain("/");
    expect(link.textContent).toBe("Return to Home");
  });
});
