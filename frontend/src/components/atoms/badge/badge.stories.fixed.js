import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./badge.js";

export default {
  title: "Atoms/Badge",
  component: "neo-badge",
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "danger", "info"],
      description: "The variant style of the badge",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the badge",
    },
    rounded: {
      control: "boolean",
      description: "Whether the badge has rounded corners",
    },
  },
  parameters: {
    docs: {
      description: {
        component: "A badge component for displaying short status information.",
      },
    },
  },
};

// Use a function that returns a string instead of a template literal
const Template = (args) => {
  return `
    <neo-badge
      variant="${args.variant || "primary"}"
      size="${args.size || "md"}"
      ${args.rounded ? "rounded" : ""}
    >
      ${args.label || "Badge"}
    </neo-badge>
  `;
};

// Basic Variants
export const Primary = Template.bind({});
Primary.args = {
  label: "Primary",
  variant: "primary",
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: "Secondary",
  variant: "secondary",
};

export const Success = Template.bind({});
Success.args = {
  label: "Success",
  variant: "success",
};

export const Warning = Template.bind({});
Warning.args = {
  label: "Warning",
  variant: "warning",
};

export const Danger = Template.bind({});
Danger.args = {
  label: "Danger",
  variant: "danger",
};

export const Info = Template.bind({});
Info.args = {
  label: "Info",
  variant: "info",
};

// Sizes
export const Small = Template.bind({});
Small.args = {
  label: "Small",
  size: "sm",
};

export const Medium = Template.bind({});
Medium.args = {
  label: "Medium",
  size: "md",
};

export const Large = Template.bind({});
Large.args = {
  label: "Large",
  size: "lg",
};

// Rounded
export const Rounded = Template.bind({});
Rounded.args = {
  label: "Rounded",
  rounded: true,
};

// Badge Group Example
export const BadgeGroup = () => {
  return `
    <div style="display: flex; gap: 8px;">
      <neo-badge variant="primary">New</neo-badge>
      <neo-badge variant="success">Approved</neo-badge>
      <neo-badge variant="warning">Pending</neo-badge>
      <neo-badge variant="danger">Rejected</neo-badge>
    </div>
  `;
};
