import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./text-input.js";

export default {
  title: "Atoms/Text Input",
  component: "neo-text-input",
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    label: { control: "text" },
    value: { control: "text" },
    placeholder: { control: "text" },
    helper: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readonly: { control: "boolean" },
    clearable: { control: "boolean" },
    onInput: { action: "input" },
    onChange: { action: "change" },
  },
};

// Base template for all stories
const Template = (args) => {
  return html`
    <neo-text-input
      .type=${args.type}
      .label=${args.label}
      .value=${args.value}
      .placeholder=${args.placeholder}
      .helper=${args.helper}
      .error=${args.error}
      ?disabled=${args.disabled}
      ?required=${args.required}
      ?readonly=${args.readonly}
      ?clearable=${args.clearable}
      @neo-input=${args.onInput}
      @neo-change=${args.onChange}
    ></neo-text-input>
  `;
};

// Default text input
export const Default = Template.bind({});
Default.args = {
  type: "text",
  label: "Name",
  value: "",
  placeholder: "Enter your name",
  helper: "",
  error: "",
  disabled: false,
  required: false,
  readonly: false,
  clearable: false,
};

// Text input with value
export const WithValue = Template.bind({});
WithValue.args = {
  ...Default.args,
  value: "John Doe",
};

// Text input with helper text
export const WithHelperText = Template.bind({});
WithHelperText.args = {
  ...Default.args,
  helper: "Enter your full name as it appears on your ID",
};

// Text input with error
export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  error: "Name is required",
  value: "",
};

// Password input
export const Password = Template.bind({});
Password.args = {
  ...Default.args,
  type: "password",
  label: "Password",
  placeholder: "Enter your password",
  helper: "Password must be at least 8 characters",
};

// Email input
export const Email = Template.bind({});
Email.args = {
  ...Default.args,
  type: "email",
  label: "Email",
  placeholder: "Enter your email",
};

// Required input
export const Required = Template.bind({});
Required.args = {
  ...Default.args,
  required: true,
  label: "Username (required)",
};

// Disabled input
export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
  value: "John Doe",
  label: "Name (disabled)",
};

// Readonly input
export const Readonly = Template.bind({});
Readonly.args = {
  ...Default.args,
  readonly: true,
  value: "John Doe",
  label: "Name (readonly)",
};

// Clearable input
export const Clearable = Template.bind({});
Clearable.args = {
  ...Default.args,
  clearable: true,
  value: "John Doe",
  label: "Name (clearable)",
};

// Input with prefix and suffix
export const WithPrefixAndSuffix = (args) => {
  return html`
    <neo-text-input
      .type=${args.type}
      .label=${args.label}
      .value=${args.value}
      .placeholder=${args.placeholder}
      .helper=${args.helper}
      ?clearable=${args.clearable}
      @neo-input=${args.onInput}
      @neo-change=${args.onChange}
    >
      <span slot="prefix">@</span>
      <span slot="suffix">.com</span>
    </neo-text-input>
  `;
};

WithPrefixAndSuffix.args = {
  type: "text",
  label: "Username",
  value: "",
  placeholder: "username",
  helper: "Enter your username without the @ symbol",
  clearable: true,
};
