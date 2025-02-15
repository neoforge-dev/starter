import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import "./text-input.js";
import "../icon/icon.js";

export default {
  title: "Atoms/Text Input",
  component: "neo-text-input",
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
      description: "Type of the input field",
    },
    label: {
      control: "text",
      description: "Label text for the input",
    },
    value: {
      control: "text",
      description: "Current value of the input",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when input is empty",
    },
    helper: {
      control: "text",
      description: "Helper text displayed below the input",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    required: {
      control: "boolean",
      description: "Whether the input is required",
    },
    readonly: {
      control: "boolean",
      description: "Whether the input is read-only",
    },
    clearable: {
      control: "boolean",
      description: "Whether to show a clear button when input has value",
    },
    onInput: { action: "neo-input" },
    onChange: { action: "neo-change" },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/...",
    },
    docs: {
      description: {
        component:
          "A versatile text input component that supports various types, states, and validations.",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "label",
            enabled: true,
          },
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
  <neo-text-input
    type=${ifDefined(args.type)}
    label=${ifDefined(args.label)}
    .value=${ifDefined(args.value)}
    placeholder=${ifDefined(args.placeholder)}
    helper=${ifDefined(args.helper)}
    error=${ifDefined(args.error)}
    ?disabled=${args.disabled}
    ?required=${args.required}
    ?readonly=${args.readonly}
    ?clearable=${args.clearable}
    @neo-input=${args.onInput}
    @neo-change=${args.onChange}
  >
    ${args.prefix ? html`<span slot="prefix">${args.prefix}</span>` : ""}
    ${args.suffix ? html`<span slot="suffix">${args.suffix}</span>` : ""}
  </neo-text-input>
`;

// Basic Examples
export const Default = Template.bind({});
Default.args = {
  label: "Username",
  placeholder: "Enter your username",
  helper: "Choose a unique username",
};

export const WithValue = Template.bind({});
WithValue.args = {
  label: "Email",
  value: "user@example.com",
  type: "email",
};

export const WithError = Template.bind({});
WithError.args = {
  label: "Password",
  type: "password",
  value: "weak",
  error: "Password must be at least 8 characters long",
  required: true,
};

// States
export const Disabled = Template.bind({});
Disabled.args = {
  label: "Disabled Input",
  value: "Cannot edit this",
  disabled: true,
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  label: "Read Only Input",
  value: "Cannot edit this",
  readonly: true,
};

// Input Types
export const Password = Template.bind({});
Password.args = {
  label: "Password",
  type: "password",
  value: "secretpassword",
  helper: "Must be at least 8 characters",
};

export const Number = Template.bind({});
Number.args = {
  label: "Age",
  type: "number",
  placeholder: "Enter your age",
  required: true,
};

// With Icons
export const WithPrefixIcon = Template.bind({});
WithPrefixIcon.args = {
  label: "Search",
  placeholder: "Search...",
  prefix: html`<neo-icon name="search"></neo-icon>`,
  clearable: true,
};

export const WithSuffixIcon = Template.bind({});
WithSuffixIcon.args = {
  label: "Calendar",
  value: "2024-03-15",
  suffix: html`<neo-icon name="calendar_today"></neo-icon>`,
  readonly: true,
};

// Advanced Examples
export const SearchInput = Template.bind({});
SearchInput.args = {
  placeholder: "Search...",
  prefix: html`<neo-icon name="search"></neo-icon>`,
  clearable: true,
};

export const LoginForm = () => html`
  <div
    style="display: flex; flex-direction: column; gap: 1rem; max-width: 300px;"
  >
    <neo-text-input
      label="Email"
      type="email"
      required
      placeholder="Enter your email"
      helper="We'll never share your email"
    >
      <neo-icon slot="prefix" name="mail"></neo-icon>
    </neo-text-input>

    <neo-text-input
      label="Password"
      type="password"
      required
      placeholder="Enter your password"
      helper="Must be at least 8 characters"
    >
      <neo-icon slot="prefix" name="lock"></neo-icon>
    </neo-text-input>
  </div>
`;

export const InputGroup = () => html`
  <div style="display: flex; gap: 1rem;">
    <neo-text-input
      type="number"
      label="Width"
      value="100"
      style="width: 120px;"
    >
      <span slot="suffix">px</span>
    </neo-text-input>

    <neo-text-input
      type="number"
      label="Height"
      value="100"
      style="width: 120px;"
    >
      <span slot="suffix">px</span>
    </neo-text-input>
  </div>
`;
