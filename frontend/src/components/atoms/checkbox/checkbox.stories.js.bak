import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ifDefined } from 'lit/directives/if-defined.js';
import './checkbox.js';

export default {
  title: 'Atoms/Checkbox',
  component: 'neo-checkbox',
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the checkbox',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Whether the checkbox is in an indeterminate state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the checkbox is required',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helper: {
      control: 'text',
      description: 'Helper text to display',
    },
    onChange: { action: 'changed' },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
    docs: {
      description: {
        component: 'A checkbox component that follows atomic design principles and provides various states.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'aria-allowed-attr',
            enabled: true,
          },
        ],
      },
    },
  },
};

const Template = (args) => html`
  <neo-checkbox
    label="${args.label || ''}"
    ?checked="${args.checked}"
    ?disabled="${args.disabled}"
    ?required="${args.required}"
    ?indeterminate="${args.indeterminate}"
    error="${args.error || ''}"
  ></neo-checkbox>
`;

export const Default = Template.bind({});
Default.args = {
  label: 'Default Checkbox',
};

export const Checked = Template.bind({});
Checked.args = {
  label: 'Checked Checkbox',
  checked: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Checkbox',
  disabled: true,
};

export const Required = Template.bind({});
Required.args = {
  label: 'Required Checkbox',
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Checkbox with Error',
  error: 'This field is required',
};

export const Indeterminate = Template.bind({});
Indeterminate.args = {
  label: 'Indeterminate Checkbox',
  indeterminate: true,
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  label: 'Disabled Checked Checkbox',
  disabled: true,
  checked: true,
};

export const WithLongLabel = Template.bind({});
WithLongLabel.args = {
  label: 'This is a very long label that demonstrates how the checkbox handles wrapping text in a clean and readable way',
};

// Checkbox Group Example
export const CheckboxGroup = () => html\`
  <div style="display: grid; gap: 8px;">
    <neo-checkbox checked>Option 1</neo-checkbox>
    <neo-checkbox>Option 2</neo-checkbox>
    <neo-checkbox>Option 3</neo-checkbox>
  </div>
\`;

// Nested Checkbox Example
export const NestedCheckboxes = () => html\`
  <div style="display: grid; gap: 8px;">
    <neo-checkbox indeterminate>Parent Option</neo-checkbox>
    <div style="margin-left: 24px; display: grid; gap: 8px;">
      <neo-checkbox checked>Child Option 1</neo-checkbox>
      <neo-checkbox>Child Option 2</neo-checkbox>
      <neo-checkbox checked>Child Option 3</neo-checkbox>
    </div>
  </div>
\`;

// Terms and Conditions Example
export const TermsCheckbox = () => html\`
  <neo-checkbox 
    required
    helper="Please read and accept the terms"
  >
    I agree to the <a href="#" style="color: var(--color-primary);">Terms and Conditions</a>
  </neo-checkbox>
\`;

// Custom Styling Example
export const CustomStyled = () => html\`
  <neo-checkbox style="--checkbox-color: var(--color-success); --checkbox-size: 24px;">
    Custom Styled Checkbox
  </neo-checkbox>
\`; 