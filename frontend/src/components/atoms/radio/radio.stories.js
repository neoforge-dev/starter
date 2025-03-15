import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ifDefined } from 'lit/directives/if-defined.js';
import './radio.js';

export default {
  title: 'Atoms/Radio',
  component: 'neo-radio',
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the radio button',
    },
    name: {
      control: 'text',
      description: 'Name attribute for the radio group',
    },
    value: {
      control: 'text',
      description: 'Value of the radio button',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the radio button is checked',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio button is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the radio button is required',
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
        component: 'A radio button component that follows atomic design principles and provides various states.',
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

// Base Template
const Template = ({ 
  label, 
  name, 
  value, 
  checked, 
  disabled, 
  required, 
  error, 
  helper 
}) => html`
  <neo-radio
    name=\${ifDefined(name)}
    value=\${ifDefined(value)}
    ?checked=\${checked}
    ?disabled=\${disabled}
    ?required=\${required}
    error=\${ifDefined(error)}
    helper=\${ifDefined(helper)}
    @change=\${(e) => console.log('Radio changed:', e.target.checked)}
  >
    \${label}
  </neo-radio>
`;

// Stories
export const Default = Template.bind({});
Default.args = {
  label: 'Default Radio',
  name: 'default',
  value: 'default',
};

export const Checked = Template.bind({});
Checked.args = {
  label: 'Checked Radio',
  name: 'checked',
  value: 'checked',
  checked: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Radio',
  name: 'disabled',
  value: 'disabled',
  disabled: true,
};

export const Required = Template.bind({});
Required.args = {
  label: 'Required Radio',
  name: 'required',
  value: 'required',
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Radio with Error',
  name: 'error',
  value: 'error',
  error: 'Please select an option',
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  label: 'Disabled Checked Radio',
  name: 'disabled-checked',
  value: 'disabled-checked',
  disabled: true,
  checked: true,
};

// Radio Group Example
export const RadioGroup = () => html`
  <div style="display: grid; gap: 8px;">
    <neo-radio name="group" value="1" label="Option 1" checked></neo-radio>
    <neo-radio name="group" value="2" label="Option 2"></neo-radio>
    <neo-radio name="group" value="3" label="Option 3"></neo-radio>
  </div>
`;

// Radio Group with Description
export const RadioGroupWithDescription = () => html`
  <div style="display: grid; gap: 16px;">
    <neo-radio 
      name="plan" 
      value="basic" 
      label="Basic Plan"
      checked
    >
      <div slot="description" style="color: var(--color-text-light); font-size: 14px; margin-top: 4px;">
        Perfect for personal use
      </div>
    </neo-radio>
    <neo-radio 
      name="plan" 
      value="pro" 
      label="Pro Plan"
    >
      <div slot="description" style="color: var(--color-text-light); font-size: 14px; margin-top: 4px;">
        Ideal for professionals
      </div>
    </neo-radio>
    <neo-radio 
      name="plan" 
      value="enterprise" 
      label="Enterprise Plan"
    >
      <div slot="description" style="color: var(--color-text-light); font-size: 14px; margin-top: 4px;">
        For large organizations
      </div>
    </neo-radio>
  </div>
`;

// Inline Radio Group
export const InlineRadioGroup = () => html`
  <div style="display: flex; gap: 16px; align-items: center;">
    <neo-radio name="inline" value="small" label="Small"></neo-radio>
    <neo-radio name="inline" value="medium" label="Medium" checked></neo-radio>
    <neo-radio name="inline" value="large" label="Large"></neo-radio>
  </div>
`;

// Custom Styled Radio Group
export const CustomStyledRadioGroup = () => html`
  <div style="display: grid; gap: 8px;">
    <neo-radio 
      name="custom" 
      value="success" 
      label="Success Option"
      style="--radio-color: var(--color-success);"
    ></neo-radio>
    <neo-radio 
      name="custom" 
      value="warning" 
      label="Warning Option"
      style="--radio-color: var(--color-warning);"
    ></neo-radio>
    <neo-radio 
      name="custom" 
      value="error" 
      label="Error Option"
      style="--radio-color: var(--color-error);"
    ></neo-radio>
  </div>
`;

// Radio with Description
export const RadioWithDescription = () => html`
  <div role="radiogroup" aria-label="Select a plan" style="display: grid; gap: 16px;">
    <neo-radio name="plan" value="basic" checked>
      <div style="display: grid; gap: 4px;">
        <strong>Basic Plan</strong>
        <small style="color: var(--color-text-secondary);">Perfect for starters</small>
      </div>
    </neo-radio>
    <neo-radio name="plan" value="pro">
      <div style="display: grid; gap: 4px;">
        <strong>Pro Plan</strong>
        <small style="color: var(--color-text-secondary);">For growing teams</small>
      </div>
    </neo-radio>
  </div>
`;

// Card Radio Example
export const CardRadio = () => html`
  <div role="radiogroup" aria-label="Select a payment method" style="display: grid; gap: 16px;">
    <label style="
      display: block;
      padding: 16px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <neo-radio name="payment" value="credit" checked></neo-radio>
        <div>
          <strong>Credit Card</strong>
          <div style="color: var(--color-text-secondary);">Pay with Visa, Mastercard</div>
        </div>
      </div>
    </label>
    <label style="
      display: block;
      padding: 16px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <neo-radio name="payment" value="paypal"></neo-radio>
        <div>
          <strong>PayPal</strong>
          <div style="color: var(--color-text-secondary);">Pay with your PayPal account</div>
        </div>
      </div>
    </label>
  </div>
`; 