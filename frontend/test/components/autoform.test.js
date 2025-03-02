import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../src/components/form/autoform.js";

describe("NeoAutoform - Basic Tests", () => {
  let element;

  const simpleSchema = {
    title: "Test Form",
    description: "A test form",
    required: ["name", "email"],
    properties: {
      name: {
        type: "string",
        title: "Name",
        minLength: 3,
      },
      email: {
        type: "string",
        title: "Email",
        format: "email",
      },
    },
  };

  beforeEach(async () => {
    element = await fixture(html`
      <neo-autoform .schema=${simpleSchema} .value=${{}}></neo-autoform>
    `);
  });

  afterEach(() => {
    element = null;
  });

  it("renders with the correct title", async () => {
    const title = element.shadowRoot.querySelector("h2");
    expect(title.textContent).to.equal("Test Form");
  });

  it("renders form fields based on schema", async () => {
    const inputs = element.shadowRoot.querySelectorAll("input");
    expect(inputs.length).to.equal(2);

    const labels = element.shadowRoot.querySelectorAll("label");
    expect(labels[0].textContent.trim()).to.contain("Name");
    expect(labels[1].textContent.trim()).to.contain("Email");
  });

  it("handles input changes", async () => {
    const nameInput = element.shadowRoot.querySelector('input[name="name"]');
    nameInput.value = "John Doe";
    nameInput.dispatchEvent(new Event("input"));

    expect(element.value.name).to.equal("John Doe");
  });

  it("validates required fields on submit", async () => {
    const form = element.shadowRoot.querySelector("form");
    form.dispatchEvent(new Event("submit"));

    await element.updateComplete;

    const errors = element.shadowRoot.querySelectorAll(".error-message");
    expect(errors.length).to.equal(2);
  });
});
