import { describe, it, expect, beforeEach } from "vitest";
import { fixture, waitForUpdate } from "../setup.js";
import "../../pages/404-page.js";

describe("404 Page", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(`<not-found-page></not-found-page>`);
    await element.updateComplete;
  });

  it("renders the 404 page", async () => {
    await element.updateComplete;
    const h1 = element.shadowRoot.querySelector("h1");
    expect(h1.textContent).toBe("404 - Page Not Found");
  });

  it("contains a link to home", async () => {
    await element.updateComplete;
    const link = element.shadowRoot.querySelector("a");
    expect(link.href).toContain("/");
    expect(link.textContent).toBe("Return to Home");
  });
});
