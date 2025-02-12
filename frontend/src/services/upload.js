import { store } from "./store.js";
import { toast } from "../components/ui/toast.js";

export class UploadService {
  constructor() {
    this.uploadQueue = new Map();
    this.activeUploads = 0;
    this.maxConcurrent = 3;
  }

  async upload(file, options = {}) {
    const uploadId = crypto.randomUUID();
    const upload = {
      id: uploadId,
      file,
      progress: 0,
      status: "pending",
      ...options,
    };

    this.uploadQueue.set(uploadId, upload);
    this._updateStore();

    if (this.activeUploads < this.maxConcurrent) {
      await this._processUpload(upload);
    }

    return uploadId;
  }

  async _processUpload(upload) {
    this.activeUploads++;
    upload.status = "uploading";
    this._updateStore();

    try {
      const formData = new FormData();
      formData.append("file", upload.file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        onUploadProgress: (progressEvent) => {
          upload.progress = (progressEvent.loaded / progressEvent.total) * 100;
          this._updateStore();
        },
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      upload.status = "complete";
      upload.result = result;

      toast.success("File uploaded successfully");
    } catch (error) {
      upload.status = "error";
      upload.error = error.message;
      toast.error("Upload failed: " + error.message);
    } finally {
      this.activeUploads--;
      this._updateStore();
      this._processNextUpload();
    }
  }

  _processNextUpload() {
    if (this.activeUploads >= this.maxConcurrent) return;

    const pending = Array.from(this.uploadQueue.values()).find(
      (upload) => upload.status === "pending"
    );

    if (pending) {
      this._processUpload(pending);
    }
  }

  _updateStore() {
    store.setState({
      uploads: Array.from(this.uploadQueue.values()),
    });
  }

  cancelUpload(uploadId) {
    const upload = this.uploadQueue.get(uploadId);
    if (upload && upload.status === "pending") {
      this.uploadQueue.delete(uploadId);
      this._updateStore();
      return true;
    }
    return false;
  }

  getUploadStatus(uploadId) {
    return this.uploadQueue.get(uploadId);
  }
}

export const uploadService = new UploadService();
