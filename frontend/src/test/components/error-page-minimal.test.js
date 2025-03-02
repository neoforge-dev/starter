import { expect, describe, it } from "vitest";
import { ErrorPage } from "../../components/error-page.js";

describe("ErrorPage Minimal Test", () => {
  it("can be instantiated", () => {
    const element = new ErrorPage();
    expect(element).to.be.instanceOf(ErrorPage);
    expect(element.code).to.equal("404");
    expect(element.message).to.equal("Page Not Found");
  });
});
