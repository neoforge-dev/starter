import { LitElement, html, css } from "lit";

export class FileUpload extends LitElement {
  static get properties() {
    return {
      accept: { type: String },
      multiple: { type: Boolean },
      maxSize: { type: Number },
      maxFiles: { type: Number },
      uploading: { type: Boolean },
      files: { type: Array },
      error: { type: String },
      dragActive: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .upload-container {
        border: 2px dashed var(--color-border, #ddd);
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        background: var(--color-background, white);
        transition: all 0.2s ease;
      }

      .upload-container.drag-active {
        border-color: var(--color-primary, #2196f3);
        background: var(--color-primary-light, rgba(33, 150, 243, 0.1));
      }

      .upload-icon {
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
        color: var(--color-text-secondary, #666);
      }

      .upload-text {
        margin-bottom: 1rem;
        color: var(--color-text, #333);
      }

      .upload-subtext {
        font-size: 0.875rem;
        color: var(--color-text-secondary, #666);
      }

      .file-input {
        display: none;
      }

      .browse-button {
        color: var(--color-primary, #2196f3);
        text-decoration: underline;
        cursor: pointer;
      }

      .file-list {
        margin-top: 1rem;
        text-align: left;
      }

      .file-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        background: var(--color-surface, #f5f5f5);
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }

      .file-info {
        flex: 1;
        margin-right: 1rem;
      }

      .file-name {
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .file-size {
        font-size: 0.75rem;
        color: var(--color-text-secondary, #666);
      }

      .remove-button {
        padding: 0.25rem;
        background: none;
        border: none;
        color: var(--color-error, #f44336);
        cursor: pointer;
      }

      .error-message {
        color: var(--color-error, #f44336);
        font-size: 0.875rem;
        margin-top: 0.5rem;
      }

      .progress-bar {
        height: 4px;
        background: var(--color-surface, #f5f5f5);
        border-radius: 2px;
        overflow: hidden;
        margin-top: 0.25rem;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--color-primary, #2196f3);
        transition: width 0.2s ease;
      }
    `;
  }

  constructor() {
    super();
    this.accept = "*";
    this.multiple = false;
    this.maxSize = 5 * 1024 * 1024; // 5MB
    this.maxFiles = 10;
    this.uploading = false;
    this.files = [];
    this.error = "";
    this.dragActive = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("dragenter", this.handleDragIn);
    this.addEventListener("dragleave", this.handleDragOut);
    this.addEventListener("dragover", this.handleDrag);
    this.addEventListener("drop", this.handleDrop);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("dragenter", this.handleDragIn);
    this.removeEventListener("dragleave", this.handleDragOut);
    this.removeEventListener("dragover", this.handleDrag);
    this.removeEventListener("drop", this.handleDrop);
  }

  handleDragIn(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dragActive = true;
  }

  handleDragOut(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dragActive = false;
  }

  handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dragActive = false;

    const droppedFiles = [...e.dataTransfer.files];
    this.handleFiles(droppedFiles);
  }

  handleFiles(newFiles) {
    this.error = "";

    // Check number of files
    if (this.multiple) {
      if (this.files.length + newFiles.length > this.maxFiles) {
        this.error = `Maximum ${this.maxFiles} files allowed`;
        return;
      }
    } else if (newFiles.length > 1) {
      this.error = "Only one file allowed";
      return;
    }

    // Check file types and sizes
    const validFiles = newFiles.filter((file) => {
      if (file.size > this.maxSize) {
        this.error = `File ${file.name} exceeds maximum size of ${this.formatSize(this.maxSize)}`;
        return false;
      }

      if (
        this.accept !== "*" &&
        !this.accept.split(",").some((type) => {
          type = type.trim();
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(new RegExp(type.replace("*", ".*")));
        })
      ) {
        this.error = `File ${file.name} has an invalid type`;
        return false;
      }

      return true;
    });

    if (validFiles.length) {
      this.files = this.multiple ? [...this.files, ...validFiles] : validFiles;
      this.dispatchEvent(
        new CustomEvent("files-changed", { detail: this.files })
      );
    }
  }

  handleBrowseClick() {
    const input = this.shadowRoot.querySelector(".file-input");
    input.click();
  }

  handleInputChange(e) {
    const files = [...e.target.files];
    this.handleFiles(files);
    e.target.value = ""; // Reset input
  }

  removeFile(index) {
    this.files = this.files.filter((_, i) => i !== index);
    this.dispatchEvent(
      new CustomEvent("files-changed", { detail: this.files })
    );
  }

  formatSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  render() {
    return html`
      <div class="upload-container ${this.dragActive ? "drag-active" : ""}">
        <svg
          class="upload-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>

        <div class="upload-text">
          Drag and drop your files here or
          <span class="browse-button" @click=${this.handleBrowseClick}
            >browse</span
          >
        </div>

        <div class="upload-subtext">
          ${this.multiple ? `Up to ${this.maxFiles} files` : "Single file"} •
          Max size: ${this.formatSize(this.maxSize)} •
          ${this.accept === "*"
            ? "All file types"
            : `Accepted types: ${this.accept}`}
        </div>

        <input
          type="file"
          class="file-input"
          .accept=${this.accept}
          ?multiple=${this.multiple}
          @change=${this.handleInputChange}
        />

        ${this.error
          ? html` <div class="error-message">${this.error}</div> `
          : ""}
        ${this.files.length > 0
          ? html`
              <div class="file-list">
                ${this.files.map(
                  (file, index) => html`
                    <div class="file-item">
                      <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">
                          ${this.formatSize(file.size)}
                        </div>
                        ${this.uploading
                          ? html`
                              <div class="progress-bar">
                                <div
                                  class="progress-bar-fill"
                                  style="width: ${file.progress || 0}%"
                                ></div>
                              </div>
                            `
                          : ""}
                      </div>
                      <button
                        class="remove-button"
                        @click=${() => this.removeFile(index)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  `
                )}
              </div>
            `
          : ""}
      </div>
    `;
  }
}

customElements.define("neo-file-upload", FileUpload);
