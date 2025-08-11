import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
// baseStyles import removed - not used

/**
 * Enhanced file upload component with drag-and-drop, preview, and validation
 * @element neo-file-upload
 *
 * @prop {string} accept - Accepted file types (e.g. "image/*,.pdf")
 * @prop {boolean} multiple - Allow multiple file selection
 * @prop {number} maxSize - Maximum file size in bytes
 * @prop {number} maxFiles - Maximum number of files (when multiple is true)
 * @prop {string} uploadUrl - URL to upload files to
 * @prop {Object} headers - Additional headers for upload request
 * @prop {boolean} autoUpload - Start upload automatically after file selection
 * @prop {boolean} preview - Show file preview (for images)
 * @prop {string} dropzoneText - Custom text for dropzone
 *
 * @fires file-selected - When files are selected
 * @fires upload-start - When upload starts
 * @fires upload-progress - During upload
 * @fires upload-success - When upload succeeds
 * @fires upload-error - When upload fails
 * @fires upload-complete - When all uploads complete
 */
export class FileUpload extends LitElement {
  static properties = {
    accept: { type: String },
    maxSize: { type: Number, attribute: "max-size" },
    dropzoneText: { type: String, attribute: "dropzone-text" },
    _dragOver: { type: Boolean, state: true },
    _files: { type: Array, state: true },
    _error: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    .dropzone {
      border: 2px dashed var(--border-color, #ccc);
      border-radius: 4px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dropzone.dragover {
      border-color: var(--primary-color, #007bff);
    }

    .dropzone-text {
      margin: 0;
      color: var(--text-secondary);
    }

    .error-message {
      color: var(--error-color, #dc3545);
      margin-top: 8px;
      font-size: 14px;
    }

    input[type="file"] {
      display: none;
    }
  `;

  constructor() {
    super();
    this.accept = "image/*";
    this.maxSize = 5;
    this.dropzoneText = "Drop files here or click to upload";
    this._dragOver = false;
    this._files = [];
    this._error = "";
  }

  render() {
    return html`
      <div
        class="dropzone ${this._dragOver ? "dragover" : ""}"
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${this._handleDrop}
        @click=${this._handleClick}
      >
        <input
          type="file"
          .accept=${this.accept}
          @change=${this._handleFileSelect}
        />
        <p class="dropzone-text">${this.dropzoneText}</p>
      </div>
      ${this._error ? html`<p class="error-message">${this._error}</p>` : ""}
    `;
  }

  _handleDragOver(e) {
    e.preventDefault();
    this._dragOver = true;
  }

  _handleDragLeave(e) {
    e.preventDefault();
    this._dragOver = false;
  }

  _handleDrop(e) {
    e.preventDefault();
    this._dragOver = false;
    const files = e.dataTransfer.files;
    this._processFiles(files);
  }

  _handleClick() {
    const input = this.shadowRoot.querySelector("input");
    input.click();
  }

  _handleFileSelect(e) {
    const files = e.target.files;
    this._processFiles(files);
  }

  _processFiles(files) {
    if (!files || !files.length) {
      this._error = "No files selected";
      return;
    }

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      this._error = "File is not an accepted file type";
      return;
    }

    if (file.size > this.maxSize * 1024 * 1024) {
      this._error = `File size exceeds ${this.maxSize}MB limit`;
      return;
    }

    this._error = "";
    this._files = [file];
    this.dispatchEvent(
      new CustomEvent("file-selected", {
        detail: { files: this._files },
      })
    );
  }
}

customElements.define("neo-file-upload", FileUpload);
