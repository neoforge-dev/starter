import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './input.js';

export default {
  title: 'Atoms/Input',
  component: 'neo-input',
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'url', 'search'],
      description: 'The type of input',
    },
    label: {
      control: 'text',
      description: 'Label text for the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helper: {
      control: 'text',
      description: 'Helper text to display below the input',
    },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
    docs: {
      description: {
        component: 'A versatile input component that follows atomic design principles and provides various states and validations.',
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
            id: 'aria-label',
            enabled: true,
          },
        ],
      },
    },
  },
};

// Base Template
const Template = ({ 
  type, 
  label, 
  placeholder, 
  value, 
  required, 
  disabled, 
  error, 
  helper 
}) => html\`
  <neo-input
    type=\${ifDefined(type)}
    label=\${ifDefined(label)}
    placeholder=\${ifDefined(placeholder)}
    value=\${ifDefined(value)}
    ?required=\${required}
    ?disabled=\${disabled}
    error=\${ifDefined(error)}
    helper=\${ifDefined(helper)}
    @change=\${(e) => console.log('Input changed:', e.target.value)}
    @focus=\${() => console.log('Input focused')}
    @blur=\${() => console.log('Input blurred')}
  ></neo-input>
\`;

// Stories
export const Text = Template.bind({});
Text.args = {
  type: 'text',
  label: 'Username',
  placeholder: 'Enter your username',
};

export const Password = Template.bind({});
Password.args = {
  type: 'password',
  label: 'Password',
  placeholder: '••••••••',
};

export const Email = Template.bind({});
Email.args = {
  type: 'email',
  label: 'Email',
  placeholder: 'user@example.com',
};

export const Required = Template.bind({});
Required.args = {
  type: 'text',
  label: 'Required Field',
  required: true,
};

export const WithError = Template.bind({});
WithError.args = {
  type: 'email',
  label: 'Email',
  value: 'invalid-email',
  error: 'Please enter a valid email address',
};

export const WithHelper = Template.bind({});
WithHelper.args = {
  type: 'text',
  label: 'Username',
  helper: 'Username must be at least 3 characters',
};

export const Disabled = Template.bind({});
Disabled.args = {
  type: 'text',
  label: 'Disabled Input',
  value: 'Cannot edit this',
  disabled: true,
};

// Form Field Example
export const FormField = () => html\`
  <div style="max-width: 300px;">
    <neo-input
      type="email"
      label="Email Address"
      required
      helper="We'll never share your email"
    ></neo-input>
  </div>
\`;

// Input Group Example
export const InputGroup = () => html\`
  <div style="display: grid; gap: 16px; max-width: 300px;">
    <neo-input
      type="text"
      label="First Name"
      required
    ></neo-input>
    <neo-input
      type="text"
      label="Last Name"
      required
    ></neo-input>
  </div>
\`;

// Search Input Example
export const SearchInput = () => html\`
  <neo-input
    type="search"
    label="Search"
    placeholder="Search..."
    helper="Press Enter to search"
  >
    <neo-icon slot="prefix" name="search"></neo-icon>
    <neo-button slot="suffix" variant="icon">
      <neo-icon name="clear"></neo-icon>
    </neo-button>
  </neo-input>
\`;

// Number Input with Controls
export const NumberInput = () => html\`
  <neo-input
    type="number"
    label="Quantity"
    value="1"
    min="0"
    max="100"
    step="1"
  >
    <neo-button slot="prefix" variant="icon" @click=\${() => this.value--}>
      <neo-icon name="remove"></neo-icon>
    </neo-button>
    <neo-button slot="suffix" variant="icon" @click=\${() => this.value++}>
      <neo-icon name="add"></neo-icon>
    </neo-button>
  </neo-input>
\`; 