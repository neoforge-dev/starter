import "./file-upload.js";
import { html } from "lit";

export default {
  title: "Components/File Upload",
  component: "file-upload",
  tags: ["autodocs"],
  argTypes: {
    accept: { control: "text" },
    multiple: { control: "boolean" },
    maxSize: { control: "number" },
    onUpload: { action: "uploaded" },
  },
};

export const Default = {
  args: {
    accept: "*",
    multiple: true,
    maxSize: 5 * 1024 * 1024, // 5 MB
  },
};
