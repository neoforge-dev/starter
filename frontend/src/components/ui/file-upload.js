import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

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
    multiple: { type: Boolean },
    maxSize: { type: Number },
    maxFiles: { type: Number },
    uploadUrl: { type: String },
    headers: { type: Object },
    autoUpload: { type: Boolean },
    preview: { type: Boolean },
    dropzoneText: { type: String },
    _dragOver: { type: Boolean, state: true },
    _files: { type: Array, state: true },
    _uploading: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .dropzone {
        position: relative;
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        text-align: center;
        cursor: pointer;
        transition: all var(--transition-fast);
        background: var(--surface-color);
      }

      :host([disabled]) .dropzone {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .dropzone.drag-over {
        border-color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-color) 5%, transparent);
      }

      .dropzone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
      }

      .dropzone-icon {
        font-size: 48px;
        color: var(--text-tertiary);
      }

      .dropzone-text {
        color: var(--text-secondary);
      }

      .dropzone-subtext {
        font-size: var(--font-size-sm);
        color: var(--text-tertiary);
      }

      .file-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
      }

      .file-item {
        position: relative;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--surface-color);
      }

      .file-preview {
        position: relative;
        aspect-ratio: 16/9;
        background: var(--surface-color);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .file-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .file-preview-icon {
        font-size: 48px;
        color: var(--text-tertiary);
      }

      .file-info {
        padding: var(--spacing-sm);
      }

      .file-name {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--spacing-xs);
        word-break: break-word;
      }

      .file-size {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
      }

      .file-status {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .file-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        background: var(--primary-color);
        transition: width var(--transition-fast);
      }

      .file-actions {
        position: absolute;
        top: var(--spacing-xs);
        right: var(--spacing-xs);
        display: flex;
        gap: var(--spacing-xs);
      }

      .file-action-button {
        width: 24px;
        height: 24px;
        border-radius: var(--radius-full);
        background: var(--surface-color);
        color: var(--text-color);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-sm);
        transition: all var(--transition-fast);
      }

      .file-action-button:hover {
        background: var(--primary-color);
        color: white;
      }

      .error-text {
        color: var(--error-color);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      @media (max-width: 640px) {
        .file-list {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.accept = "*";
    this.multiple = false;
    this.maxSize = 5 * 1024 * 1024; // 5MB default
    this.maxFiles = 10;
    this.uploadUrl = "";
    this.headers = {};
    this.autoUpload = true;
    this.preview = true;
    this.dropzoneText = "Drop files here or click to upload";
    this._dragOver = false;
    this._files = [];
    this._uploading = false;
    this._abortControllers = new Map();
  }

  /**
   * Start upload process
   * @returns {Promise} Resolves when all uploads complete
   */
  async upload() {
    if (this._uploading || !this._files.length) return;

    this._uploading = true;
    this.dispatchEvent(new CustomEvent("upload-start"));

    try {
      await Promise.all(
        this._files
          .filter((file) => file.status === "pending")
          .map((file) => this._uploadFile(file))
      );

      this.dispatchEvent(new CustomEvent("upload-complete"));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      this._uploading = false;
    }
  }

  /**
   * Clear all files
   */
  clear() {
    this._files = [];
    this._abortControllers.forEach((controller) => controller.abort());
    this._abortControllers.clear();
  }

  /**
   * Handle file selection
   * @param {Event} e
   */
  _handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    this._addFiles(files);
    e.target.value = ""; // Reset input
  }

  /**
   * Handle drag over
   * @param {DragEvent} e
   */
  _handleDragOver(e) {
    e.preventDefault();
    if (!this._dragOver) {
      this._dragOver = true;
    }
  }

  /**
   * Handle drag leave
   * @param {DragEvent} e
   */
  _handleDragLeave(e) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      this._dragOver = false;
    }
  }

  /**
   * Handle drop
   * @param {DragEvent} e
   */
  _handleDrop(e) {
    e.preventDefault();
    this._dragOver = false;
    const files = Array.from(e.dataTransfer.files || []);
    this._addFiles(files);
  }

  /**
   * Add files to queue
   * @param {File[]} files
   */
  async _addFiles(files) {
    if (!files.length) return;

    // Filter files
    const validFiles = files.filter((file) => {
      // Check file type
      if (this.accept !== "*") {
        const acceptedTypes = this.accept.split(",").map((type) => type.trim());
        const isValidType = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });

        if (!isValidType) {
          this._showError(`${file.name} is not an accepted file type`);
          return false;
        }
      }

      // Check file size
      if (file.size > this.maxSize) {
        this._showError(
          `${file.name} exceeds maximum size of ${this._formatSize(this.maxSize)}`
        );
        return false;
      }

      return true;
    });

    // Check max files
    if (this.multiple) {
      if (this._files.length + validFiles.length > this.maxFiles) {
        this._showError(`Maximum ${this.maxFiles} files allowed`);
        return;
      }
    } else if (validFiles.length > 1) {
      this._showError("Only one file allowed");
      return;
    }

    // Add preview data for images
    const filesWithPreview = await Promise.all(
      validFiles.map(async (file) => {
        const fileData = {
          id: Math.random().toString(36).slice(2),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "pending",
          progress: 0,
          error: null,
        };

        if (this.preview && file.type.startsWith("image/")) {
          try {
            fileData.preview = await this._createPreview(file);
          } catch (error) {
            console.error("Preview generation failed:", error);
          }
        }

        return fileData;
      })
    );

    // Update files
    this._files = this.multiple
      ? [...this._files, ...filesWithPreview]
      : [filesWithPreview[0]];

    this.dispatchEvent(
      new CustomEvent("file-selected", {
        detail: { files: filesWithPreview },
      })
    );

    if (this.autoUpload) {
      this.upload();
    }
  }

  /**
   * Create image preview
   * @param {File} file
   * @returns {Promise<string>} Preview URL
   */
  _createPreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload a single file
   * @param {Object} fileData
   */
  async _uploadFile(fileData) {
    const controller = new AbortController();
    this._abortControllers.set(fileData.id, controller);

    try {
      const formData = new FormData();
      formData.append("file", fileData.file);

      const response = await fetch(this.uploadUrl, {
        method: "POST",
        headers: this.headers,
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(\`Upload failed: \${response.statusText}\`);
      }

      const result = await response.json();

      this._updateFile(fileData.id, {
        status: "complete",
        progress: 100,
        response: result,
      });

      this.dispatchEvent(
        new CustomEvent("upload-success", {
          detail: { file: fileData, response: result },
        })
      );
    } catch (error) {
      if (error.name === "AbortError") {
        this._updateFile(fileData.id, {
          status: "cancelled",
          error: "Upload cancelled",
        });
      } else {
        this._updateFile(fileData.id, {
          status: "error",
          error: error.message,
        });

        this.dispatchEvent(
          new CustomEvent("upload-error", {
            detail: { file: fileData, error },
          })
        );
      }
    } finally {
      this._abortControllers.delete(fileData.id);
    }
  }

  /**
   * Update file data
   * @param {string} id
   * @param {Object} data
   */
  _updateFile(id, data) {
    this._files = this._files.map((file) =>
      file.id === id ? { ...file, ...data } : file
    );
  }

  /**
   * Remove file
   * @param {string} id
   */
  _removeFile(id) {
    const controller = this._abortControllers.get(id);
    if (controller) {
      controller.abort();
    }
    this._files = this._files.filter((file) => file.id !== id);
  }

  /**
   * Show error message
   * @param {string} message
   */
  _showError(message) {
    this.dispatchEvent(
      new CustomEvent("upload-error", {
        detail: { error: new Error(message) },
      })
    );
  }

  /**
   * Format file size
   * @param {number} bytes
   * @returns {string}
   */
  _formatSize(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return \`\${size.toFixed(1)} \${units[unitIndex]}\`;
  }

  /**
   * Get file icon based on type
   * @param {string} type
   * @returns {string}
   */
  _getFileIcon(type) {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "movie";
    if (type.startsWith("audio/")) return "audiotrack";
    if (type.includes("pdf")) return "picture_as_pdf";
    if (type.includes("word")) return "description";
    if (type.includes("excel") || type.includes("spreadsheet")) return "table_chart";
    if (type.includes("presentation")) return "slideshow";
    return "insert_drive_file";
  }

  render() {
    return html`
      <div
        class="dropzone ${this._dragOver ? "drag-over" : ""}"
        @click=${() => this.shadowRoot.querySelector('input[type="file"]').click()}
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

        <div class="dropzone-content">
          <span class="material-icons dropzone-icon">cloud_upload</span>
          <div class="dropzone-text">${this.dropzoneText}</div>
          <div class="dropzone-subtext">
            ${this.accept !== "*"
              ? html`Accepted files: ${this.accept}`
              : ""}
            ${this.maxSize
              ? html`<br />Maximum size: ${this._formatSize(this.maxSize)}`
              : ""}
          </div>
        </div>
      </div>

      ${this._files.length
        ? html`
            <div class="file-list">
              ${this._files.map(
                (file) => html`
                  <div class="file-item">
                    <div class="file-preview">
                      ${file.preview
                        ? html`<img src=${file.preview} alt=${file.name} />`
                        : html`
                            <span class="material-icons file-preview-icon">
                              ${this._getFileIcon(file.type)}
                            </span>
                          `}
                      ${file.status === "uploading"
                        ? html`
                            <div
                              class="file-progress"
                              style="width: ${file.progress}%"
                            ></div>
                          `
                        : ""}
                    </div>

                    <div class="file-info">
                      <div class="file-name">${file.name}</div>
                      <div class="file-size">${this._formatSize(file.size)}</div>
                      ${file.error
                        ? html`<div class="error-text">${file.error}</div>`
                        : ""}
                    </div>

                    <div class="file-actions">
                      ${file.status === "pending" || file.status === "error"
                        ? html`
                            <button
                              class="file-action-button"
                              @click=${() => this._removeFile(file.id)}
                              title="Remove file"
                            >
                              <span class="material-icons">close</span>
                            </button>
                          `
                        : ""}
                      ${file.status === "complete"
                        ? html`
                            <button
                              class="file-action-button"
                              @click=${() => this._removeFile(file.id)}
                              title="Remove file"
                            >
                              <span class="material-icons">check</span>
                            </button>
                          `
                        : ""}
                    </div>
                  </div>
                `
              )}
            </div>
          `
        : ""}
    `;
  }
}

customElements.define("neo-file-upload", FileUpload);
