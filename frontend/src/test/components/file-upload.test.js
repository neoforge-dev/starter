import { html, fixture, expect } from "@open-wc/testing";
import { TestRunner, ComponentTester, Assert } from "../test-utils.js";
import "../../src/components/ui/file-upload.js";

describe("FileUpload Component", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(
      html`<neo-file-upload accept="image/*" max-size="5"></neo-file-upload>`
    );
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    Assert.notNull(element);
    Assert.equal(element.accept, "image/*");
    Assert.equal(element.maxSize, 5);

    const dropzone = element.shadowRoot.querySelector(".dropzone");
    Assert.notNull(dropzone, "Dropzone should exist");

    const dropzoneText = dropzone.querySelector(".dropzone-text");
    Assert.notNull(dropzoneText, "Dropzone text should exist");
    Assert.include(dropzoneText.textContent, "Drop files here");
  });

  it("handles file selection", async () => {
    let fileData = null;
    element.addEventListener("file-selected", (e) => (fileData = e.detail));

    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const input = element.shadowRoot.querySelector('input[type="file"]');
    Assert.notNull(input, "File input should exist");

    const event = new Event("change");
    Object.defineProperty(input, "files", {
      value: [file],
    });

    input.dispatchEvent(event);
    await element.updateComplete;

    Assert.notNull(fileData);
    Assert.equal(fileData.files[0].name, "test.jpg");
  });

  it("validates file type", async () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = element.shadowRoot.querySelector('input[type="file"]');
    Assert.notNull(input, "File input should exist");

    const event = new Event("change");
    Object.defineProperty(input, "files", {
      value: [file],
    });

    input.dispatchEvent(event);
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    Assert.notNull(errorMessage, "Error message should be displayed");
    Assert.include(errorMessage.textContent, "not an accepted file type");
  });

  it("validates file size", async () => {
    const largeContent = new Array(6 * 1024 * 1024).fill("a").join(""); // 6MB
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const input = element.shadowRoot.querySelector('input[type="file"]');
    Assert.notNull(input, "File input should exist");

    const event = new Event("change");
    Object.defineProperty(input, "files", {
      value: [file],
    });

    input.dispatchEvent(event);
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    Assert.notNull(errorMessage, "Error message should be displayed");
    Assert.include(errorMessage.textContent, "exceeds");
  });

  it("handles drag and drop", async () => {
    const dropzone = element.shadowRoot.querySelector(".dropzone");
    Assert.notNull(dropzone, "Dropzone should exist");

    // Test dragover
    const dragoverEvent = new Event("dragover");
    dragoverEvent.preventDefault = () => {};
    dropzone.dispatchEvent(dragoverEvent);
    await element.updateComplete;

    Assert.true(
      dropzone.classList.contains("dragover"),
      "Should show dragover state"
    );

    // Test drop
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const dropEvent = new Event("drop");
    dropEvent.preventDefault = () => {};
    dropEvent.dataTransfer = { files: [file] };

    let fileData = null;
    element.addEventListener("file-selected", (e) => (fileData = e.detail));

    dropzone.dispatchEvent(dropEvent);
    await element.updateComplete;

    Assert.notNull(fileData);
    Assert.equal(fileData.files[0].name, "test.jpg");
  });
});
