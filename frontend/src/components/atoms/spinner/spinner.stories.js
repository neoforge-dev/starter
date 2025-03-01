import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ifDefined } from "lit/directives/if-defined.js";
import "./spinner.js";

export default {
  title: "Atoms/Spinner",
  component: "neo-spinner",
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the spinner",
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "error"],
      description: "Color of the spinner",
    },
    variant: {
      control: "select",
      options: ["border", "dots", "pulse"],
      description: "Visual style of the spinner",
    },
    label: {
      control: "text",
      description: "Accessible label for screen readers",
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/...",
    },
    docs: {
      description: {
        component:
          "A versatile loading spinner component that provides visual feedback during loading states.",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "aria-label",
            enabled: true,
          },
        ],
      },
    },
  },
};

const Template = (args) => html`
  <neo-spinner
    size=${args.size || "md"}
    color=${args.color || "primary"}
    variant=${args.variant || "border"}
    label=${args.label || "Loading..."}
  ></neo-spinner>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {};

export const Large = Template.bind({});
Large.args = {
  size: "lg",
};

export const Small = Template.bind({});
Small.args = {
  size: "sm",
};

// Variants
export const Border = Template.bind({});
Border.args = {
  variant: "border",
};

export const Dots = Template.bind({});
Dots.args = {
  variant: "dots",
};

export const Pulse = Template.bind({});
Pulse.args = {
  variant: "pulse",
};

// Colors
export const Primary = Template.bind({});
Primary.args = {
  color: "primary",
};

export const Secondary = Template.bind({});
Secondary.args = {
  color: "secondary",
};

export const Success = Template.bind({});
Success.args = {
  color: "success",
};

export const Error = Template.bind({});
Error.args = {
  color: "error",
};

// Use cases
export const LoadingButton = () => html`
  <button
    style="
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: var(--color-primary);
      color: white;
      cursor: pointer;
    "
  >
    <neo-spinner size="sm" color="secondary"></neo-spinner>
    Loading...
  </button>
`;

export const LoadingCard = () => html`
  <div
    style="
      padding: 16px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
    "
  >
    <neo-spinner size="lg"></neo-spinner>
    <p style="margin-top: 16px; color: var(--color-text-secondary);">
      Loading content...
    </p>
  </div>
`;

export const LoadingTable = () => html`
  <div
    style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      background: #f5f5f5;
      border-radius: 8px;
    "
  >
    <div style="text-align: center;">
      <neo-spinner variant="dots" size="lg"></neo-spinner>
      <p style="margin-top: 16px; color: var(--color-text-secondary);">
        Loading table data...
      </p>
    </div>
  </div>
`;

export const InlineSpinners = () => html`
  <div style="display: flex; gap: 16px; align-items: center;">
    <neo-spinner size="sm" variant="border"></neo-spinner>
    <neo-spinner size="sm" variant="dots"></neo-spinner>
    <neo-spinner size="sm" variant="pulse"></neo-spinner>
  </div>
`;
