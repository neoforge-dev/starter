import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { StoreMixin } from "../../services/store.js";
import { uploadService } from "../../services/upload.js";

export class FileUpload extends StoreMixin(LitElement) {
  static properties = {
    accept: { type: String },
    multiple: { type: Boolean },
    maxSize: { type: Number },
    uploads: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .dropzone {
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        text-align: center;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .dropzone.dragging {
        background: var(--surface-2);
        border-color: var(--primary-color);
      }

      .upload-list {
        margin-top: var(--spacing-lg);
      }

      .upload-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
      }

      .progress-bar {
        flex: 1;
        height: 4px;
        background: var(--surface-2);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--primary-color);
        transition: width var(--transition-fast);
      }

      .status-icon {
        font-size: var(--font-size-xl);
      }

      .status-complete {
        color: var(--success-color);
      }

      .status-error {
        color: var(--error-color);
      }
    `,
  ];

  constructor() {
    super();
    this.accept = "*";
    this.multiple = false;
    this.maxSize = 5 * 1024 * 1024; // 5MB default
    this.uploads = [];
  }

  stateChanged(property, value, state) {
    if (property === "uploads") {
      this.uploads = value;
    }
  }

  render() {
    return html`
      <div
        class="dropzone"
        @click=${this._handleClick}
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${this._handleDrop}
      >
        <input
          type="file"
          .accept=${this.accept}
          ?multiple=${this.multiple}
          @change=${this._handleFileSelect}
          hidden
        />
        <div>
          <div class="material-icons">cloud_upload</div>
          <p>Drop files here or click to upload</p>
        </div>
      </div>

      <div class="upload-list">
        ${this.uploads.map(
          (upload) => html`
            <div class="upload-item">
              <div class="file-info">
                <div>${upload.file.name}</div>
                <div class="file-size">
                  ${this._formatSize(upload.file.size)}
                </div>
              </div>

              ${upload.status === "uploading"
                ? html`
                    <div class="progress-bar">
                      <div
                        class="progress-bar-fill"
                        style="width: ${upload.progress}%"
                      ></div>
                    </div>
                  `
                : ""}
              ${upload.status === "complete"
                ? html`
                    <span class="material-icons status-icon status-complete">
                      check_circle
                    </span>
                  `
                : ""}
              ${upload.status === "error"
                ? html`
                    <span class="material-icons status-icon status-error">
                      error
                    </span>
                  `
                : ""}
              ${upload.status === "pending"
                ? html`
                    <button @click=${() => this._cancelUpload(upload.id)}>
                      Cancel
                    </button>
                  `
                : ""}
            </div>
          `
        )}
      </div>
    `;
  }

  _handleClick() {
    this.shadowRoot.querySelector('input[type="file"]').click();
  }

  _handleDragOver(e) {
    e.preventDefault();
    this.shadowRoot.querySelector(".dropzone").classList.add("dragging");
  }

  _handleDragLeave(e) {
    e.preventDefault();
    this.shadowRoot.querySelector(".dropzone").classList.remove("dragging");
  }

  _handleDrop(e) {
    e.preventDefault();
    this.shadowRoot.querySelector(".dropzone").classList.remove("dragging");
    this._processFiles(e.dataTransfer.files);
  }

  _handleFileSelect(e) {
    this._processFiles(e.target.files);
  }

  async _processFiles(fileList) {
    const files = Array.from(fileList);

    for (const file of files) {
      if (file.size > this.maxSize) {
        toast.error(
          `File ${file.name} exceeds maximum size of ${this._formatSize(this.maxSize)}`
        );
        continue;
      }

      await uploadService.upload(file);
    }
  }

  _cancelUpload(uploadId) {
    uploadService.cancelUpload(uploadId);
  }

  _formatSize(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

customElements.define("file-upload", FileUpload);
