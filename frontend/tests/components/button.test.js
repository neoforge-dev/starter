import { html, fixture, expect } from "@open-wc/testing";
import { TestRunner, ComponentTester, Assert } from "../test-utils.js";
import "../../src/components/ui/button.js";

describe("Button Component", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<my-button>Click me</my-button>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    Assert.notNull(element);
    Assert.equal(element.textContent.trim(), "Click me");
  });

  it("responds to click events", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    const button = element.shadowRoot.querySelector("button");
    await ComponentTester.click(button);
    Assert.true(clicked);
  });

  it("reflects variant attribute", async () => {
    element.variant = "primary";
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    Assert.true(button.classList.contains("primary"));
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    Assert.true(button.hasAttribute("disabled"));
  });

  it("shows loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const spinner = element.shadowRoot.querySelector(".loading-spinner");
    Assert.notNull(spinner);
  });
});
