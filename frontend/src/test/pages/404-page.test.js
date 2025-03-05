import { describe, it, expect, beforeEach } from "vitest";
import { TestUtils } from "../setup.mjs";
import "../../pages/404-page.js";

describe("404 Page", () => {
  let element;

  beforeEach(async () => {
    element = await TestUtils.fixture(
      TestUtils.html`<not-found-page></not-found-page>`
    );
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
