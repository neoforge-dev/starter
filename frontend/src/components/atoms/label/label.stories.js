export default {
  title: "Atoms/Label",
  component: "neo-label",
  parameters: {
    docs: {
      description: {
        component: `
The Label component provides accessible labeling for form controls with support for required indicators and help text.

## Features
- Accessibility-focused with proper \`for\` attribute support
- Required field indicator (*)
- Help text association for screen readers
- WCAG compliant styling
- Multiple sizes (sm, md, lg)
- Disabled state support
- Integration with form components

## Usage
Use this component to label form inputs, selects, and other form controls. It automatically handles ARIA attributes for accessibility.
        `,
      },
    },
  },
  argTypes: {
    for: {
      control: "text",
      description: "The ID of the form control this label is associated with",
    },
    required: {
      control: "boolean",
      description: "Whether the associated form control is required",
    },
    helpText: {
      control: "text",
      description: "Help text to display below the label",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size of the label",
    },
    disabled: {
      control: "boolean",
      description: "Whether the label should appear disabled",
    },
    content: {
      control: "text",
      description: "Label text content",
    },
  },
};

const Template = ({ content, ...args }) => {
  return `
    <neo-label 
      ${args.for ? `for="${args.for}"` : ""}
      ${args.required ? "required" : ""}
      ${args.helpText ? `help-text="${args.helpText}"` : ""}
      ${args.size ? `size="${args.size}"` : ""}
      ${args.disabled ? "disabled" : ""}
    >
      ${content || "Label Text"}
    </neo-label>
  `;
};

export const Default = Template.bind({});
Default.args = {
  content: "Username",
  for: "username-input",
};

export const Required = Template.bind({});
Required.args = {
  content: "Password",
  for: "password-input",
  required: true,
};

export const WithHelpText = Template.bind({});
WithHelpText.args = {
  content: "Email Address",
  for: "email-input",
  helpText: "We'll never share your email with anyone else.",
};

export const RequiredWithHelpText = Template.bind({});
RequiredWithHelpText.args = {
  content: "Confirm Password",
  for: "confirm-password-input",
  required: true,
  helpText: "Must match the password entered above",
};

export const SmallSize = Template.bind({});
SmallSize.args = {
  content: "Small Label",
  for: "small-input",
  size: "sm",
};

export const LargeSize = Template.bind({});
LargeSize.args = {
  content: "Large Label",
  for: "large-input", 
  size: "lg",
};

export const Disabled = Template.bind({});
Disabled.args = {
  content: "Disabled Label",
  for: "disabled-input",
  disabled: true,
  helpText: "This field is currently disabled",
};

export const WithFormExample = () => {
  return `
    <div style="max-width: 400px; display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <neo-label for="example-username" required>Username</neo-label>
        <input id="example-username" type="text" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
      </div>
      
      <div>
        <neo-label for="example-email" help-text="We'll use this to send you important updates">Email</neo-label>
        <input id="example-email" type="email" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
      </div>
      
      <div>
        <neo-label for="example-bio" size="lg">Bio</neo-label>
        <textarea id="example-bio" rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"></textarea>
      </div>
    </div>
  `;
};

WithFormExample.parameters = {
  docs: {
    description: {
      story: "Example showing how labels integrate with actual form controls.",
    },
  },
};