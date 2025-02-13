import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/file-upload.js";

describe("FileUpload", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-file-upload></neo-file-upload>`);
  });

  it("renders with default properties", () => {
    const dropzone = element.shadowRoot.querySelector(".dropzone");
    const input = element.shadowRoot.querySelector("input[type='file']");
    const dropzoneText = element.shadowRoot.querySelector(".dropzone-text");

    expect(dropzone).to.exist;
    expect(input).to.exist;
    expect(dropzoneText).to.exist;
    expect(dropzoneText.textContent).to.equal(
      "Drop files here or click to upload"
    );
    expect(input.accept).to.equal("image/*");
    expect(element.maxSize).to.equal(5);
  });

  it("handles custom properties", async () => {
    element = await fixture(html`
      <neo-file-upload
        accept=".pdf,.doc"
        max-size="10"
        dropzone-text="Custom dropzone text"
      ></neo-file-upload>
    `);

    const input = element.shadowRoot.querySelector("input[type='file']");
    const dropzoneText = element.shadowRoot.querySelector(".dropzone-text");

    expect(input.accept).to.equal(".pdf,.doc");
    expect(element.maxSize).to.equal(10);
    expect(dropzoneText.textContent).to.equal("Custom dropzone text");
  });

  it("updates dragover state on dragover/dragleave", async () => {
    const dropzone = element.shadowRoot.querySelector(".dropzone");

    // Simulate dragover
    dropzone.dispatchEvent(new DragEvent("dragover", { bubbles: true }));
    await element.updateComplete;
    expect(dropzone.classList.contains("dragover")).to.be.true;

    // Simulate dragleave
    dropzone.dispatchEvent(new DragEvent("dragleave", { bubbles: true }));
    await element.updateComplete;
    expect(dropzone.classList.contains("dragover")).to.be.false;
  });

  it("handles file selection via click", async () => {
    const input = element.shadowRoot.querySelector("input");
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    const fileSelectPromise = oneEvent(element, "file-selected");

    // Simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    const { detail } = await fileSelectPromise;
    expect(detail.files).to.have.lengthOf(1);
    expect(detail.files[0].name).to.equal("test.jpg");
  });

  it("handles file drop", async () => {
    const dropzone = element.shadowRoot.querySelector(".dropzone");
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    const fileSelectPromise = oneEvent(element, "file-selected");

    // Simulate file drop
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      dataTransfer,
    });

    dropzone.dispatchEvent(dropEvent);

    const { detail } = await fileSelectPromise;
    expect(detail.files).to.have.lengthOf(1);
    expect(detail.files[0].name).to.equal("test.jpg");
  });

  it("validates file type", async () => {
    const input = element.shadowRoot.querySelector("input");
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    // Simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await element.updateComplete;
    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.equal(
      "File is not an accepted file type"
    );
  });

  it("validates file size", async () => {
    const input = element.shadowRoot.querySelector("input");
    // Create a file larger than maxSize (5MB)
    const largeFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      "large.jpg",
      { type: "image/jpeg" }
    );

    // Simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(largeFile);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await element.updateComplete;
    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.equal("File size exceeds 5MB limit");
  });

  it("clears error message on valid file selection", async () => {
    // First trigger an error
    const input = element.shadowRoot.querySelector("input");
    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });

    let dataTransfer = new DataTransfer();
    dataTransfer.items.add(invalidFile);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".error-message")).to.exist;

    // Then select a valid file
    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    dataTransfer = new DataTransfer();
    dataTransfer.items.add(validFile);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".error-message")).to.not.exist;
  });

  it("dispatches file-selected event", async () => {
    let selectedFiles;
    element.addEventListener("file-selected", (e) => {
      selectedFiles = e.detail.files;
    });

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const input = element.shadowRoot.querySelector("input");
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change"));

    expect(selectedFiles).to.exist;
    expect(selectedFiles.length).to.equal(1);
    expect(selectedFiles[0].name).to.equal("test.jpg");
  });

  it("handles click to upload", () => {
    const input = element.shadowRoot.querySelector("input");
    let clicked = false;
    input.click = () => {
      clicked = true;
    };

    const dropzone = element.shadowRoot.querySelector(".dropzone");
    dropzone.click();

    expect(clicked).to.be.true;
  });

  it("handles empty file selection", async () => {
    const dataTransfer = new DataTransfer();
    const dropzone = element.shadowRoot.querySelector(".dropzone");
    dropzone.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        dataTransfer,
      })
    );

    await element.updateComplete;
    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage.textContent).to.equal("No files selected");
  });
});
