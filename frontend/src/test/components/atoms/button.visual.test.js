import { html } from "lit";
import { fixture, expect } from "@open-wc/testing";
import { visualDiff } from "@web/test-runner-visual-regression";
import "../../../components/atoms/button/button.js";

describe("neo-button visual regression", () => {
  it("primary button renders correctly", async () => {
    const element = await fixture(html`
      <neo-button variant="primary">Primary Button</neo-button>
    `);
    await visualDiff(element, "button-primary");
  });

  it("secondary button renders correctly", async () => {
    const element = await fixture(html`
      <neo-button variant="secondary">Secondary Button</neo-button>
    `);
    await visualDiff(element, "button-secondary");
  });

  it("text button renders correctly", async () => {
    const element = await fixture(html`
      <neo-button variant="text">Text Button</neo-button>
    `);
    await visualDiff(element, "button-text");
  });

  it("disabled button renders correctly", async () => {
    const element = await fixture(html`
      <neo-button disabled>Disabled Button</neo-button>
    `);
    await visualDiff(element, "button-disabled");
  });

  it("loading button renders correctly", async () => {
    const element = await fixture(html`
      <neo-button loading>Loading Button</neo-button>
    `);
    await visualDiff(element, "button-loading");
  });

  it("size variants render correctly", async () => {
    const container = await fixture(html`
      <div>
        <neo-button size="sm">Small</neo-button>
        <neo-button size="md">Medium</neo-button>
        <neo-button size="lg">Large</neo-button>
      </div>
    `);
    await visualDiff(container, "button-sizes");
  });
});
