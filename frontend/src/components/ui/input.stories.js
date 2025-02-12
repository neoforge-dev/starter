import { Input } from "./input.js";

export default {
  title: "Components/Input",
  component: "neo-input",
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    label: { control: "text" },
    placeholder: { control: "text" },
    value: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    error: { control: "text" },
    helper: { control: "text" },
    onChange: { action: "changed" },
    onFocus: { action: "focused" },
    onBlur: { action: "blurred" },
  },
};

export const Text = {
  args: {
    type: "text",
    label: "Username",
    placeholder: "Enter your username",
  },
};

export const Email = {
  args: {
    type: "email",
    label: "Email Address",
    placeholder: "Enter your email",
  },
};

export const Password = {
  args: {
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
  },
};

export const WithError = {
  args: {
    type: "email",
    label: "Email Address",
    value: "invalid-email",
    error: "Please enter a valid email address",
  },
};

export const WithHelper = {
  args: {
    type: "password",
    label: "Password",
    helper: "Password must be at least 8 characters long",
  },
};

export const Disabled = {
  args: {
    type: "text",
    label: "Disabled Input",
    value: "Cannot edit this",
    disabled: true,
  },
};

export const Required = {
  args: {
    type: "text",
    label: "Required Field",
    required: true,
  },
};
