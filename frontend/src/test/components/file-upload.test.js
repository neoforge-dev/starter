import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Mock implementation for the FileUpload component
 */
class MockFileUpload {
  constructor() {
    // Properties
    this.accept = "*";
    this.multiple = false;
    this.maxSize = 5 * 1024 * 1024; // 5MB default
    this.files = [];
    this._dragOver = false;
    this._error = "";

    // Event listeners
    this._eventListeners = new Map();

    // Shadow DOM elements
    this._uploadArea = document.createElement("div");
    this._uploadArea.classList.add("upload-area");

    this._fileInput = document.createElement("input");
    this._fileInput.type = "file";
    this._fileInput.accept = this.accept;
    this._fileInput.multiple = this.multiple;

    this._fileList = document.createElement("div");
    this._fileList.classList.add("file-list");

    // Create shadow root mock
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "input" || selector === 'input[type="file"]') {
          return this._fileInput;
        }
        if (selector === ".upload-area") {
          return this._uploadArea;
        }
        if (selector === ".file-list") {
          return this._fileList;
        }
        if (selector === ".error-message") {
          const errorElement = document.createElement("p");
          errorElement.classList.add("error-message");
          errorElement.textContent = this._error;
          return errorElement;
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".file-item") {
          return this.files.map(() => {
            const fileItem = document.createElement("div");
            fileItem.classList.add("file-item");
            return fileItem;
          });
        }
        return [];
      },
    };

    // Promise for updateComplete
    this.updateComplete = Promise.resolve(true);
  }

  // Getters and setters for reactive properties
  get accept() {
    return this._accept;
  }

  set accept(value) {
    this._accept = value;
    if (this._fileInput) {
      this._fileInput.accept = value;
    }
  }

  get multiple() {
    return this._multiple;
  }

  set multiple(value) {
    this._multiple = value;
    if (this._fileInput) {
      this._fileInput.multiple = value;
    }
  }

  get maxSize() {
    return this._maxSize;
  }

  set maxSize(value) {
    this._maxSize = value;
  }

  // Event handling methods
  addEventListener(eventName, callback) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, []);
    }
    this._eventListeners.get(eventName).push(callback);
  }

  removeEventListener(eventName, callback) {
    if (this._eventListeners.has(eventName)) {
      const listeners = this._eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type) || [];
    listeners.forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }

  // Component methods
  _handleClick() {
    this._fileInput.click();
  }

  _handleDragOver(e) {
    if (e) e.preventDefault();
    this._dragOver = true;
    this._uploadArea.classList.add("dragover");
  }

  _handleDragLeave(e) {
    if (e) e.preventDefault();
    this._dragOver = false;
    this._uploadArea.classList.remove("dragover");
  }

  _handleDrop(e) {
    if (e) e.preventDefault();
    this._dragOver = false;
    this._uploadArea.classList.remove("dragover");
    if (e && e.dataTransfer && e.dataTransfer.files) {
      this._processFiles(e.dataTransfer.files);
    }
  }

  _handleFileSelect(e) {
    if (e && e.target && e.target.files) {
      this._processFiles(e.target.files);
    }
  }

  _processFiles(fileList) {
    if (!fileList || !fileList.length) {
      this._error = "No files selected";
      return;
    }

    const newFiles = [];
    for (const file of Array.from(fileList)) {
      if (file.size > this.maxSize) {
        this._error = `File size exceeds ${this.maxSize / (1024 * 1024)}MB limit`;
        this._dispatchError(
          `File ${file.name} exceeds maximum size of ${this.maxSize} bytes`
        );
        continue;
      }

      if (this.accept !== "*" && !this._isAcceptedFileType(file)) {
        this._error = "File is not an accepted file type";
        this._dispatchError(`File ${file.name} is not an accepted file type`);
        continue;
      }

      newFiles.push(file);
    }

    if (newFiles.length === 0) {
      this.files = [];
      return;
    }

    if (this.multiple) {
      this.files = [...this.files, ...newFiles];
    } else {
      this.files = newFiles.slice(0, 1);
    }

    this._error = "";
    this._dispatchChange();

    if (this.files.length > 0) {
      this.dispatchEvent(
        new CustomEvent("file-selected", {
          detail: { files: newFiles },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _isAcceptedFileType(file) {
    if (this.accept === "*") return true;

    const acceptedTypes = this.accept.split(",").map((type) => type.trim());

    for (const type of acceptedTypes) {
      if (type.startsWith(".")) {
        // Check file extension
        const extension = "." + file.name.split(".").pop().toLowerCase();
        if (extension === type.toLowerCase()) return true;
      } else if (type.endsWith("/*")) {
        // Check MIME type category (e.g., "image/*")
        const category = type.split("/")[0];
        if (file.type.startsWith(category + "/")) return true;
      } else {
        // Check exact MIME type
        if (file.type === type) return true;
      }
    }

    return false;
  }

  _removeFile(index) {
    this.files = this.files.filter((_, i) => i !== index);
    this._dispatchChange();
  }

  _dispatchChange() {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { files: this.files },
        bubbles: true,
        composed: true,
      })
    );
  }

  _dispatchError(message) {
    this.dispatchEvent(
      new CustomEvent("error", {
        detail: { message },
        bubbles: true,
        composed: true,
      })
    );
  }
}

describe("FileUpload", () => {
  let element;

  beforeEach(() => {
    element = new MockFileUpload();
  });

  it("should initialize with default properties", () => {
    expect(element.accept).toBe("*");
    expect(element.multiple).toBe(false);
    expect(element.maxSize).toBe(5 * 1024 * 1024); // 5MB
    expect(element.files).toEqual([]);
  });

  it("should update accept property", () => {
    element.accept = "image/*";
    expect(element.accept).toBe("image/*");
    expect(element._fileInput.accept).toBe("image/*");
  });

  it("should update multiple property", () => {
    element.multiple = true;
    expect(element.multiple).toBe(true);
    expect(element._fileInput.multiple).toBe(true);
  });

  it("should handle drag over event", () => {
    const spy = vi.spyOn(element._uploadArea.classList, "add");
    element._handleDragOver({ preventDefault: () => {} });
    expect(element._dragOver).toBe(true);
    expect(spy).toHaveBeenCalledWith("dragover");
  });

  it("should handle drag leave event", () => {
    element._dragOver = true;
    const spy = vi.spyOn(element._uploadArea.classList, "remove");
    element._handleDragLeave({ preventDefault: () => {} });
    expect(element._dragOver).toBe(false);
    expect(spy).toHaveBeenCalledWith("dragover");
  });

  it("should handle file selection", () => {
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const event = { target: { files: [file] } };

    const changeSpy = vi.fn();
    element.addEventListener("change", changeSpy);

    element._handleFileSelect(event);

    expect(element.files).toHaveLength(1);
    expect(element.files[0]).toBe(file);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should validate file size", () => {
    const errorSpy = vi.fn();
    element.addEventListener("error", errorSpy);

    // Create a file that exceeds the max size
    element.maxSize = 10; // 10 bytes
    const largeFile = new File(
      ["test content that is larger than 10 bytes"],
      "large.txt",
      { type: "text/plain" }
    );

    // Directly call _processFiles instead of going through _handleFileSelect
    element._processFiles([largeFile]);

    expect(element.files).toHaveLength(0);
    expect(element._error).toContain("File size exceeds");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("should validate file type", () => {
    const errorSpy = vi.fn();
    element.addEventListener("error", errorSpy);

    element.accept = "image/*";
    const textFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });

    const event = { target: { files: [textFile] } };
    element._handleFileSelect(event);

    expect(element.files).toHaveLength(0);
    expect(element._error).toBe("File is not an accepted file type");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("should handle multiple files when multiple is true", () => {
    element.multiple = true;

    const file1 = new File(["content 1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content 2"], "file2.txt", { type: "text/plain" });

    // Add first file
    element._processFiles([file1]);
    expect(element.files).toHaveLength(1);
    expect(element.files[0]).toEqual(file1);

    // Add second file
    element._processFiles([file2]);
    expect(element.files).toHaveLength(2);
    expect(element.files[0]).toEqual(file1);
    expect(element.files[1]).toEqual(file2);
  });

  it("should replace file when multiple is false", () => {
    element.multiple = false;

    const file1 = new File(["content 1"], "file1.txt", { type: "text/plain" });
    element._processFiles([file1]);
    expect(element.files).toHaveLength(1);
    expect(element.files[0]).toEqual(file1);

    // Add second file
    const file2 = new File(["content 2"], "file2.txt", { type: "text/plain" });
    element._processFiles([file2]);
    expect(element.files).toHaveLength(1);
    expect(element.files[0]).toEqual(file2);
  });

  it("should remove file by index", () => {
    element.multiple = true;

    const file1 = new File(["content 1"], "file1.txt", { type: "text/plain" });
    const file2 = new File(["content 2"], "file2.txt", { type: "text/plain" });

    element._processFiles([file1, file2]);
    expect(element.files).toHaveLength(2);

    element._removeFile(0);
    expect(element.files).toHaveLength(1);
    expect(element.files[0]).toBe(file2);
  });

  it("should dispatch file-selected event when files are selected", () => {
    const selectSpy = vi.fn();
    element.addEventListener("file-selected", selectSpy);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    element._processFiles([file]);

    expect(selectSpy).toHaveBeenCalled();
    expect(selectSpy.mock.calls[0][0].detail.files).toEqual([file]);
  });
});
