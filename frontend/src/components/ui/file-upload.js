import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class FileUpload extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .upload-area {
      border: 2px dashed var(--color-border, #ccc);
      border-radius: 4px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: var(--color-primary, #007bff);
    }

    input[type="file"] {
      display: none;
    }

    .file-list {
      margin-top: 1rem;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      margin: 0.25rem 0;
      background: var(--color-surface-2, #f5f5f5);
      border-radius: 4px;
    }

    .file-name {
      flex: 1;
      margin-right: 1rem;
    }

    .remove-button {
      background: none;
      border: none;
      color: var(--color-error, #dc3545);
      cursor: pointer;
      padding: 0.25rem;
    }
  `;

  static properties = {
    accept: { type: String },
    multiple: { type: Boolean },
    maxSize: { type: Number },
    files: { type: Array, state: true },
  };

  constructor() {
    super();
    this.accept = "*";
    this.multiple = false;
    this.maxSize = 5 * 1024 * 1024; // 5MB default
    this.files = [];
  }

  render() {
    return html`
      <div
        class="upload-area"
        @click=${this._handleClick}
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${this._handleDrop}
      >
        <slot>
          <p>Drop files here or click to upload</p>
          <p>Accepted formats: ${this.accept}</p>
        </slot>
        <input
          type="file"
          .accept=${this.accept}
          ?multiple=${this.multiple}
          @change=${this._handleFileSelect}
        />
      </div>
      ${this.files.length
        ? html`
            <div class="file-list">
              ${this.files.map(
                (file, index) => html`
                  <div class="file-item">
                    <span class="file-name">${file.name}</span>
                    <button
                      class="remove-button"
                      @click=${() => this._removeFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                `
              )}
            </div>
          `
        : ""}
    `;
  }

  _handleClick() {
    this.shadowRoot.querySelector('input[type="file"]').click();
  }

  _handleDragOver(e) {
    e.preventDefault();
    this.shadowRoot.querySelector(".upload-area").classList.add("dragover");
  }

  _handleDragLeave(e) {
    e.preventDefault();
    this.shadowRoot.querySelector(".upload-area").classList.remove("dragover");
  }

  _handleDrop(e) {
    e.preventDefault();
    this.shadowRoot.querySelector(".upload-area").classList.remove("dragover");
    this._processFiles(e.dataTransfer.files);
  }

  _handleFileSelect(e) {
    this._processFiles(e.target.files);
  }

  _processFiles(fileList) {
    const newFiles = Array.from(fileList).filter((file) => {
      if (file.size > this.maxSize) {
        this._dispatchError(
          `File ${file.name} exceeds maximum size of ${this.maxSize} bytes`
        );
        return false;
      }
      return true;
    });

    if (this.multiple) {
      this.files = [...this.files, ...newFiles];
    } else {
      this.files = newFiles.slice(0, 1);
    }

    this._dispatchChange();
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

customElements.define("file-upload", FileUpload);
