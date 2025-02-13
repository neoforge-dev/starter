import "./file-upload.js";
import { html } from "lit";

export default {
  title: "Components/FileUpload",
  component: "neo-file-upload",
  argTypes: {
    accept: { control: "text" },
    multiple: { control: "boolean" },
    maxSize: { control: "number" },
    maxFiles: { control: "number" },
    autoUpload: { control: "boolean" },
    preview: { control: "boolean" },
    dropzoneText: { control: "text" },
  },
};

// Mock upload URL for demo purposes
const MOCK_UPLOAD_URL = "https://api.example.com/upload";

// Helper to simulate upload delay
const simulateUpload = () =>
  new Promise((resolve) => setTimeout(resolve, 2000));

// Basic usage
export const Basic = () => html`
  <neo-file-upload
    .uploadUrl=${MOCK_UPLOAD_URL}
    @file-selected=${(e) => console.log("Files selected:", e.detail.files)}
    @upload-success=${(e) => console.log("Upload success:", e.detail)}
    @upload-error=${(e) => console.error("Upload error:", e.detail.error)}
  ></neo-file-upload>
`;

// Image upload with preview
export const ImageUpload = () => html`
  <neo-file-upload
    accept="image/*"
    .uploadUrl=${MOCK_UPLOAD_URL}
    .preview=${true}
    .dropzoneText=${"Drop images here or click to upload"}
    @file-selected=${(e) => console.log("Images selected:", e.detail.files)}
  ></neo-file-upload>
`;

// Multiple file upload
export const MultipleFiles = () => html`
  <neo-file-upload
    .multiple=${true}
    .maxFiles=${5}
    .uploadUrl=${MOCK_UPLOAD_URL}
    .dropzoneText=${"Upload up to 5 files"}
    @file-selected=${(e) => console.log("Files selected:", e.detail.files)}
  ></neo-file-upload>
`;

// Custom file types
export const Documents = () => html`
  <neo-file-upload
    accept=".pdf,.doc,.docx,.xls,.xlsx"
    .multiple=${true}
    .uploadUrl=${MOCK_UPLOAD_URL}
    .dropzoneText=${"Upload documents (PDF, Word, Excel)"}
    @file-selected=${(e) => console.log("Documents selected:", e.detail.files)}
  ></neo-file-upload>
`;

// Size restricted
export const SizeRestricted = () => html`
  <neo-file-upload
    .maxSize=${1024 * 1024} /* 1MB */
    .uploadUrl=${MOCK_UPLOAD_URL}
    .dropzoneText=${"Maximum file size: 1MB"}
    @file-selected=${(e) => console.log("File selected:", e.detail.files)}
  ></neo-file-upload>
`;

// Manual upload mode
export const ManualUpload = () => {
  let fileUploadRef;

  const handleFileSelect = (e) => {
    console.log("Files selected:", e.detail.files);
    fileUploadRef = e.target;
  };

  const handleUploadClick = () => {
    if (fileUploadRef) {
      fileUploadRef.upload();
    }
  };

  return html`
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <neo-file-upload
        .multiple=${true}
        .autoUpload=${false}
        .uploadUrl=${MOCK_UPLOAD_URL}
        .dropzoneText=${"Select files to upload"}
        @file-selected=${handleFileSelect}
      ></neo-file-upload>

      <button @click=${handleUploadClick}>Start Upload</button>
    </div>
  `;
};

// Custom styling
export const CustomStyling = () => html`
  <style>
    .custom-upload {
      --border-color: #6366f1;
      --primary-color: #4f46e5;
      --surface-color: #f5f3ff;
      --text-color: #4338ca;
      --text-secondary: #6366f1;
      --text-tertiary: #818cf8;
      --error-color: #ef4444;
      --radius-lg: 12px;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
      --font-size-xs: 12px;
      --font-size-sm: 14px;
      --font-weight-medium: 500;
      --transition-fast: 0.2s ease;
    }
  </style>

  <neo-file-upload
    class="custom-upload"
    .multiple=${true}
    .preview=${true}
    .uploadUrl=${MOCK_UPLOAD_URL}
    .dropzoneText=${"Upload files with custom styling"}
  ></neo-file-upload>
`;

// Error handling
export const ErrorHandling = () => html`
  <neo-file-upload
    .uploadUrl=${"https://api.example.com/invalid"}
    .dropzoneText=${"This upload will fail"}
    @upload-error=${(e) => {
      console.error("Upload failed:", e.detail.error);
      alert("Upload failed: " + e.detail.error.message);
    }}
  ></neo-file-upload>
`;

// Loading state
export const Loading = () => {
  const handleFileSelected = async (e) => {
    const fileUpload = e.target;
    fileUpload.loading = true;

    try {
      await simulateUpload();
      console.log("Upload complete");
    } finally {
      fileUpload.loading = false;
    }
  };

  return html`
    <neo-file-upload
      .uploadUrl=${MOCK_UPLOAD_URL}
      @file-selected=${handleFileSelected}
    ></neo-file-upload>
  `;
};
