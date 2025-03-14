import { html } from "lit";
import "./button.js";

export default {
  title: "Atoms/Button",
  component: "neo-button",
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "tertiary", "danger", "ghost", "text"],
      description: "The visual style of the button",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "The size of the button",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "md" },
      },
    },
    type: {
      control: { type: "select" },
      options: ["button", "submit", "reset"],
      description: "The HTML type attribute",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "button" },
      },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the button is disabled",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: false },
      },
    },
    loading: {
      control: { type: "boolean" },
      description: "Whether the button is in a loading state",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: false },
      },
    },
    fullWidth: {
      control: { type: "boolean" },
      description: "Whether the button should take full width",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: false },
      },
    },
    label: {
      control: { type: "text" },
      description: "The text label of the button",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "" },
      },
    },
    iconOnly: {
      control: { type: "boolean" },
      description: "Whether the button is icon only",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: false },
      },
    },
    onClick: { action: "clicked" },
  },
};

const Template = (args) => {
  return html`
    <neo-button
      variant="${args.variant || "primary"}"
      size="${args.size || "md"}"
      type="${args.type || "button"}"
      ?disabled="${args.disabled}"
      ?loading="${args.loading}"
      ?fullWidth="${args.fullWidth}"
      ?iconOnly="${args.iconOnly}"
      label="${args.label || ""}"
      @click="${args.onClick}"
    >
      ${args.icon ? html`<span slot="icon">${args.icon}</span>` : ""}
      ${args.prefix ? html`<span slot="prefix">${args.prefix}</span>` : ""}
      ${args.suffix ? html`<span slot="suffix">${args.suffix}</span>` : ""}
    </neo-button>
  `;
};

// Default button
export const Default = Template.bind({});
Default.args = {
  label: "Button",
  variant: "primary",
  size: "md",
};

// Button variants
export const Primary = Template.bind({});
Primary.args = {
  label: "Primary Button",
  variant: "primary",
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: "Secondary Button",
  variant: "secondary",
};

export const Tertiary = Template.bind({});
Tertiary.args = {
  label: "Tertiary Button",
  variant: "tertiary",
};

export const Danger = Template.bind({});
Danger.args = {
  label: "Danger Button",
  variant: "danger",
};

export const Ghost = Template.bind({});
Ghost.args = {
  label: "Ghost Button",
  variant: "ghost",
};

export const Text = Template.bind({});
Text.args = {
  label: "Text Button",
  variant: "text",
};

// Button sizes
export const Small = Template.bind({});
Small.args = {
  label: "Small Button",
  size: "sm",
};

export const Medium = Template.bind({});
Medium.args = {
  label: "Medium Button",
  size: "md",
};

export const Large = Template.bind({});
Large.args = {
  label: "Large Button",
  size: "lg",
};

// Button states
export const Disabled = Template.bind({});
Disabled.args = {
  label: "Disabled Button",
  disabled: true,
};

export const Loading = Template.bind({});
Loading.args = {
  label: "Loading Button",
  loading: true,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  label: "Full Width Button",
  fullWidth: true,
};

// Button with icon
export const WithIcon = Template.bind({});
WithIcon.args = {
  label: "Button with Icon",
  icon: html`<neo-icon name="add"></neo-icon>`,
};

// Icon only button
export const IconOnly = Template.bind({});
IconOnly.args = {
  label: "Add",
  iconOnly: true,
  icon: html`<neo-icon name="add"></neo-icon>`,
};

// Button types
export const Submit = Template.bind({});
Submit.args = {
  label: "Submit Form",
  type: "submit",
};

export const Reset = Template.bind({});
Reset.args = {
  label: "Reset Form",
  type: "reset",
};

// Button group example
export const ButtonGroup = () => {
  return html`
    <div style="display: flex; gap: 8px;">
      <neo-button variant="primary" label="Save"></neo-button>
      <neo-button variant="tertiary" label="Cancel"></neo-button>
    </div>
  `;
};

// Responsive button example
export const ResponsiveButton = () => {
  return html`
    <div
      style="width: 100%; max-width: 600px; border: 1px dashed #ccc; padding: 16px;"
    >
      <p style="margin-bottom: 16px;">
        Resize the window to see the button adapt:
      </p>
      <neo-button fullWidth label="Responsive Full Width Button"></neo-button>
    </div>
  `;
};
