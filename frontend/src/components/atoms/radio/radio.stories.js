import { html } from 'lit';
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
            id: 'radiogroup',
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
}) => html\`
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
\`;

// Stories
export const Default = Template.bind({});
Default.args = {
  label: 'Default Radio',
  name: 'group1',
  value: 'option1',
};

export const Checked = Template.bind({});
Checked.args = {
  label: 'Checked Radio',
  name: 'group1',
  value: 'option1',
  checked: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Radio',
  name: 'group1',
  value: 'option1',
  disabled: true,
};

export const Required = Template.bind({});
Required.args = {
  label: 'Required Radio',
  name: 'group1',
  value: 'option1',
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Radio with Error',
  name: 'group1',
  value: 'option1',
  error: 'Please select an option',
};

export const WithHelper = Template.bind({});
WithHelper.args = {
  label: 'Radio with Helper',
  name: 'group1',
  value: 'option1',
  helper: 'Additional information about this option',
};

// Radio Group Example
export const RadioGroup = () => html\`
  <div role="radiogroup" aria-label="Select an option" style="display: grid; gap: 8px;">
    <neo-radio name="group2" value="option1" checked>Option 1</neo-radio>
    <neo-radio name="group2" value="option2">Option 2</neo-radio>
    <neo-radio name="group2" value="option3">Option 3</neo-radio>
  </div>
\`;

// Radio with Description
export const RadioWithDescription = () => html\`
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
\`;

// Card Radio Example
export const CardRadio = () => html\`
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
\`; 