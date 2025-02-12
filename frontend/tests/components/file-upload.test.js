import { test, expect } from "@playwright/test";

test.describe("FileUpload Component", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Storybook page for the FileUpload component
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--basic"
    );
  });

  test("renders basic dropzone", async ({ page }) => {
    const dropzone = page.locator("neo-file-upload .dropzone");
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText("Drop files here or click to upload");
  });

  test("shows custom dropzone text", async ({ page }) => {
    // Navigate to story with custom text
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--image-upload"
    );
    const dropzone = page.locator("neo-file-upload .dropzone");
    await expect(dropzone).toContainText("Drop images here or click to upload");
  });

  test("handles file selection", async ({ page }) => {
    const fileUpload = page.locator("neo-file-upload");
    const input = fileUpload.locator('input[type="file"]');

    // Create a test file
    await page.evaluate(() => {
      const testFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      document.querySelector('neo-file-upload input[type="file"]').files =
        dataTransfer.files;
      document
        .querySelector('neo-file-upload input[type="file"]')
        .dispatchEvent(new Event("change"));
    });

    // Check if file is displayed
    const fileItem = fileUpload.locator(".file-item");
    await expect(fileItem).toBeVisible();
    await expect(fileItem).toContainText("test.txt");
  });

  test("validates file size", async ({ page }) => {
    // Navigate to size restricted story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--size-restricted"
    );

    const fileUpload = page.locator("neo-file-upload");

    // Create a file larger than 1MB
    await page.evaluate(() => {
      const largeContent = new Array(1024 * 1024 + 1).join("a");
      const testFile = new File([largeContent], "large.txt", {
        type: "text/plain",
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      document.querySelector('neo-file-upload input[type="file"]').files =
        dataTransfer.files;
      document
        .querySelector('neo-file-upload input[type="file"]')
        .dispatchEvent(new Event("change"));
    });

    // Check for error message
    const errorText = fileUpload.locator(".error-text");
    await expect(errorText).toBeVisible();
    await expect(errorText).toContainText("exceeds maximum size");
  });

  test("validates file type", async ({ page }) => {
    // Navigate to documents story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--documents"
    );

    const fileUpload = page.locator("neo-file-upload");

    // Try to upload an image file when only documents are allowed
    await page.evaluate(() => {
      const testFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      document.querySelector('neo-file-upload input[type="file"]').files =
        dataTransfer.files;
      document
        .querySelector('neo-file-upload input[type="file"]')
        .dispatchEvent(new Event("change"));
    });

    // Check for error message
    const errorText = fileUpload.locator(".error-text");
    await expect(errorText).toBeVisible();
    await expect(errorText).toContainText("not an accepted file type");
  });

  test("handles multiple file upload", async ({ page }) => {
    // Navigate to multiple files story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--multiple-files"
    );

    const fileUpload = page.locator("neo-file-upload");

    // Upload multiple files
    await page.evaluate(() => {
      const files = [
        new File(["test1"], "test1.txt", { type: "text/plain" }),
        new File(["test2"], "test2.txt", { type: "text/plain" }),
      ];
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      document.querySelector('neo-file-upload input[type="file"]').files =
        dataTransfer.files;
      document
        .querySelector('neo-file-upload input[type="file"]')
        .dispatchEvent(new Event("change"));
    });

    // Check if both files are displayed
    const fileItems = fileUpload.locator(".file-item");
    await expect(fileItems).toHaveCount(2);
  });

  test("shows preview for image files", async ({ page }) => {
    // Navigate to image upload story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--image-upload"
    );

    const fileUpload = page.locator("neo-file-upload");

    // Create and upload a test image
    await page.evaluate(() => {
      // Create a small test image
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      canvas.getContext("2d").fillRect(0, 0, 100, 100);
      canvas.toBlob((blob) => {
        const file = new File([blob], "test.png", { type: "image/png" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.querySelector('neo-file-upload input[type="file"]').files =
          dataTransfer.files;
        document
          .querySelector('neo-file-upload input[type="file"]')
          .dispatchEvent(new Event("change"));
      });
    });

    // Check if preview is displayed
    const preview = fileUpload.locator(".file-preview img");
    await expect(preview).toBeVisible();
  });

  test("handles manual upload mode", async ({ page }) => {
    // Navigate to manual upload story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--manual-upload"
    );

    const fileUpload = page.locator("neo-file-upload");
    const uploadButton = page.locator('button:text("Start Upload")');

    // Upload a file
    await page.evaluate(() => {
      const testFile = new File(["test"], "test.txt", { type: "text/plain" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      document.querySelector('neo-file-upload input[type="file"]').files =
        dataTransfer.files;
      document
        .querySelector('neo-file-upload input[type="file"]')
        .dispatchEvent(new Event("change"));
    });

    // Check if file is in pending state
    const fileItem = fileUpload.locator(".file-item");
    await expect(fileItem).toBeVisible();
    await expect(fileItem).toContainText("test.txt");

    // Click upload button
    await uploadButton.click();

    // Check if upload started
    const progressBar = fileUpload.locator(".file-progress");
    await expect(progressBar).toBeVisible();
  });

  test("applies custom styling", async ({ page }) => {
    // Navigate to custom styling story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--custom-styling"
    );

    const dropzone = page.locator("neo-file-upload .dropzone");

    // Check if custom styles are applied
    await expect(dropzone).toHaveCSS("border-color", "rgb(99, 102, 241)");
    await expect(dropzone).toHaveCSS("background-color", "rgb(245, 243, 255)");
  });

  test("handles error states", async ({ page }) => {
    // Navigate to error handling story
    await page.goto(
      "http://localhost:6006/?path=/story/components-fileupload--error-handling"
    );

    const fileUpload = page.locator("neo-file-upload");

    // Upload a file
    await page.evaluate(() => {
      const testFile = new File(["test"], "test.txt", { type: "text/plain" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      document.querySelector('neo-file-upload input[type="file"]').files =
        dataTransfer.files;
      document
        .querySelector('neo-file-upload input[type="file"]')
        .dispatchEvent(new Event("change"));
    });

    // Check if error state is displayed
    const errorText = fileUpload.locator(".error-text");
    await expect(errorText).toBeVisible();
  });
});
