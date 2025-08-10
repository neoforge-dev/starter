import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./progress-bar.js";

export default {
  title: "Atoms/Progress Bar",
  component: "neo-progress-bar",
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: "number",
      description: "Current progress value (0-100)",
    },
    max: {
      control: "number",
      description: "Maximum progress value",
    },
    variant: {
      control: { type: "select" },
      options: ["default", "success", "error"],
      description: "Visual style of the progress bar",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size of the progress bar",
    },
    indeterminate: {
      control: "boolean",
      description: "Whether to show indeterminate loading state",
    },
    showLabel: {
      control: "boolean",
      description: "Whether to show the progress label",
    },
    label: {
      control: "text",
      description: "Custom label text",
    },
  },
};

const Template = (args) => html`
  <div style="width: 300px;">
    <neo-progress-bar
      .value=${args.value}
      .max=${args.max}
      .variant=${args.variant}
      .size=${args.size}
      ?indeterminate=${args.indeterminate}
      ?showLabel=${args.showLabel}
      .label=${args.label}
    ></neo-progress-bar>
  </div>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {
  value: 50,
  max: 100,
  variant: "default",
  size: "md",
  indeterminate: false,
  showLabel: false,
  label: "",
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  value: 75,
  max: 100,
  variant: "default",
  size: "md",
  indeterminate: false,
  showLabel: true,
  label: "",
};

// Sizes
export const Small = Template.bind({});
Small.args = {
  value: 50,
  max: 100,
  variant: "default",
  size: "sm",
  indeterminate: false,
  showLabel: false,
  label: "",
};

export const Medium = Template.bind({});
Medium.args = {
  value: 50,
  max: 100,
  variant: "default",
  size: "md",
  indeterminate: false,
  showLabel: false,
  label: "",
};

export const Large = Template.bind({});
Large.args = {
  value: 50,
  max: 100,
  variant: "default",
  size: "lg",
  indeterminate: false,
  showLabel: false,
  label: "",
};

// Variants
export const Success = Template.bind({});
Success.args = {
  value: 100,
  max: 100,
  variant: "success",
  size: "md",
  indeterminate: false,
  showLabel: true,
  label: "",
};

export const Error = Template.bind({});
Error.args = {
  value: 30,
  max: 100,
  variant: "error",
  size: "md",
  indeterminate: false,
  showLabel: true,
  label: "",
};

// States
export const Indeterminate = Template.bind({});
Indeterminate.args = {
  value: 0,
  max: 100,
  variant: "default",
  size: "md",
  indeterminate: true,
  showLabel: false,
  label: "",
};

export const CustomLabel = Template.bind({});
CustomLabel.args = {
  value: 60,
  max: 100,
  variant: "default",
  size: "md",
  indeterminate: false,
  showLabel: true,
  label: "Loading assets...",
};

// Use cases
export const FileUpload = () => {
  const progress = 75;
  return html`
    <div style="width: 300px;">
      <div
        style="margin-bottom: 8px; display: flex; justify-content: space-between;"
      >
        <span>Uploading file.jpg</span>
        <span>${progress}%</span>
      </div>
      <neo-progress-bar
        .value=${progress}
        variant="default"
        size="sm"
      ></neo-progress-bar>
    </div>
  `;
};

export const MultipleSteps = () => html`
  <div style="width: 300px;">
    <div style="margin-bottom: 16px;">
      <div style="margin-bottom: 4px;">Step 1: Download</div>
      <neo-progress-bar
        .value=${100}
        variant="success"
        size="sm"
      ></neo-progress-bar>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="margin-bottom: 4px;">Step 2: Process</div>
      <neo-progress-bar .value=${60} size="sm"></neo-progress-bar>
    </div>
    <div>
      <div style="margin-bottom: 4px;">Step 3: Upload</div>
      <neo-progress-bar indeterminate size="sm"></neo-progress-bar>
    </div>
  </div>
`;

export const LoadingStates = () => html`
  <div style="width: 300px;">
    <div style="margin-bottom: 24px;">
      <neo-progress-bar
        .value=${75}
        showLabel
        .label=${"Loading profile..."}
      ></neo-progress-bar>
    </div>
    <div style="margin-bottom: 24px;">
      <neo-progress-bar
        .value=${100}
        variant="success"
        showLabel
        .label=${"Assets loaded"}
      ></neo-progress-bar>
    </div>
    <div>
      <neo-progress-bar
        .value=${30}
        variant="error"
        showLabel
        .label=${"Error loading data"}
      ></neo-progress-bar>
    </div>
  </div>
`;
