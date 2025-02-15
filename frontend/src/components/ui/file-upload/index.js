import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("file-upload")
export class FileUpload extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .upload-container {
      border: 2px dashed var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.375rem);
      padding: var(--spacing-lg, 2rem);
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }

    .upload-container:hover {
      border-color: var(--color-primary, #3b82f6);
    }

    .upload-container.dragover {
      border-color: var(--color-primary, #3b82f6);
      background: var(--color-surface-hover, #f5f5f5);
    }

    input[type="file"] {
      display: none;
    }

    .file-list {
      margin-top: var(--spacing-md, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm, 0.5rem);
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-sm, 0.5rem);
      background: var(--color-surface-hover, #f5f5f5);
      border-radius: var(--radius-sm, 0.25rem);
    }

    .remove-button {
      color: var(--color-error, #dc2626);
      cursor: pointer;
      padding: var(--spacing-xs, 0.25rem);
    }
  `;

  @property({ type: String }) accept = "*";
  @property({ type: Boolean }) multiple = false;
  @property({ type: Number }) maxSize = 5 * 1024 * 1024; // 5MB default
  @property({ type: String }) dropzoneText =
    "Drop files here or click to upload";

  @state() files = [];
  @state() dragover = false;

  render() {
    return html`
      <div
        class="upload-container ${this.dragover ? "dragover" : ""}"
        @click=${this._handleClick}
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${this._handleDrop}
      >
        <input
          type="file"
          @change=${this._handleFileSelect}
          accept=${this.accept}
          ?multiple=${this.multiple}
        />
        <slot name="dropzone-content">
          <p>${this.dropzoneText}</p>
        </slot>
      </div>
      ${this.files.length > 0
        ? html`
            <div class="file-list">
              ${this.files.map(
                (file, index) => html`
                  <div class="file-item">
                    <span>${file.name}</span>
                    <span
                      class="remove-button"
                      @click=${() => this._removeFile(index)}
                    >
                      ×
                    </span>
                  </div>
                `
              )}
            </div>
          `
        : ""}
    `;
  }

  _handleClick() {
    this.shadowRoot.querySelector("input[type='file']").click();
  }

  _handleDragOver(e) {
    e.preventDefault();
    this.dragover = true;
  }

  _handleDragLeave() {
    this.dragover = false;
  }

  _handleDrop(e) {
    e.preventDefault();
    this.dragover = false;
    const files = Array.from(e.dataTransfer.files);
    this._processFiles(files);
  }

  _handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this._processFiles(files);
  }

  _processFiles(files) {
    const validFiles = files.filter((file) => {
      if (file.size > this.maxSize) {
        this._dispatchError(
          `File ${file.name} exceeds maximum size of ${this.maxSize} bytes`
        );
        return false;
      }
      return true;
    });

    if (this.multiple) {
      this.files = [...this.files, ...validFiles];
    } else {
      this.files = validFiles.slice(0, 1);
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
