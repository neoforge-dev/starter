import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../components/ui/file-upload/index.js";

describe("FileUpload", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<file-upload></file-upload>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.accept).to.equal("image/*");
    expect(element.maxSize).to.equal(5);

    const dropzone = element.shadowRoot.querySelector(".dropzone");
    expect(dropzone).to.exist;

    const dropzoneText = dropzone.querySelector(".dropzone-text");
    expect(dropzoneText).to.exist;
    expect(dropzoneText.textContent).to.include("Drop files here");
  });

  it("handles file selection", async () => {
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const event = new CustomEvent("change", {
      detail: { files: [file] },
    });

    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.files).to.deep.equal([file]);
  });

  it("validates file size", async () => {
    const largeFile = new File(["test".repeat(1000000)], "large.jpg", {
      type: "image/jpeg",
    });
    const event = new CustomEvent("change", {
      detail: { files: [largeFile] },
    });

    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.files).to.be.empty;
  });

  it("validates file type", async () => {
    const invalidFile = new File(["test"], "test.pdf", {
      type: "application/pdf",
    });
    const event = new CustomEvent("change", {
      detail: { files: [invalidFile] },
    });

    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.files).to.be.empty;
  });

  it("handles drag and drop", async () => {
    const dropzone = element.shadowRoot.querySelector(".dropzone");
    expect(dropzone).to.exist;

    // Test dragover
    const dragoverEvent = new Event("dragover");
    dragoverEvent.preventDefault = () => {};
    dropzone.dispatchEvent(dragoverEvent);
    await element.updateComplete;

    expect(dropzone.classList.contains("dragover")).to.be.true;

    // Test drop
    const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
    const dropEvent = new Event("drop");
    dropEvent.preventDefault = () => {};
    dropEvent.dataTransfer = { files: [file] };

    let fileData = null;
    element.addEventListener("file-selected", (e) => (fileData = e.detail));

    dropzone.dispatchEvent(dropEvent);
    await element.updateComplete;

    expect(fileData).to.exist;
    expect(fileData.files[0].name).to.equal("test.jpg");
  });
});
