import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../components/error-page.js";
import { ErrorPage } from "../../components/error-page.js";

describe("ErrorPage Simple Test", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-error-page></neo-error-page>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.be.instanceOf(ErrorPage);
    expect(element.code).to.equal("404");
    expect(element.message).to.equal("Page Not Found");
    expect(element.description).to.include("The page you are looking for");
  });

  it("reflects attribute changes", async () => {
    element.code = "500";
    element.message = "Server Error";
    element.description = "Something went wrong on our end.";
    await element.updateComplete;

    const codeElement = element.shadowRoot.querySelector(".error-code");
    const messageElement = element.shadowRoot.querySelector(".error-message");
    const descriptionElement =
      element.shadowRoot.querySelector(".error-description");

    expect(codeElement.textContent).to.equal("500");
    expect(messageElement.textContent).to.equal("Server Error");
    expect(descriptionElement.textContent).to.equal(
      "Something went wrong on our end."
    );
  });
});
