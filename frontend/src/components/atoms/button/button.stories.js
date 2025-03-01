import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ifDefined } from 'lit/directives/if-defined.js';
import './button.js';
import '../icon/icon.js';

export default {
  title: 'Atoms/Button',
  component: 'neo-button',
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost'],
      description: 'The variant style of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'The type of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the button should take full width',
    },
    onClick: { action: 'clicked' },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
    docs: {
      description: {
        component: 'A versatile button component that supports various styles, states, and sizes.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'button-name',
            enabled: true,
          },
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

const Template = (args) => html\`
  <neo-button
    variant=\${ifDefined(args.variant)}
    size=\${ifDefined(args.size)}
    type=\${ifDefined(args.type)}
    ?disabled=\${args.disabled}
    ?loading=\${args.loading}
    ?fullWidth=\${args.fullWidth}
    @click=\${args.onClick}
  >
    \${args.prefix ? html\`<neo-icon slot="prefix" name="\${args.prefix}"></neo-icon>\` : ""}
    \${args.label || "Button"}
    \${args.suffix ? html\`<neo-icon slot="suffix" name="\${args.suffix}"></neo-icon>\` : ""}
  </neo-button>
\`;

// Basic Variants
export const Primary = Template.bind({});
Primary.args = {
  label: 'Primary Button',
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: 'Secondary Button',
  variant: 'secondary',
};

export const Tertiary = Template.bind({});
Tertiary.args = {
  label: 'Tertiary Button',
  variant: 'tertiary',
};

export const Danger = Template.bind({});
Danger.args = {
  label: 'Danger Button',
  variant: 'danger',
};

export const Ghost = Template.bind({});
Ghost.args = {
  label: 'Ghost Button',
  variant: 'ghost',
};

// States
export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Button',
  disabled: true,
};

export const Loading = Template.bind({});
Loading.args = {
  label: 'Loading Button',
  loading: true,
};

// Sizes
export const Small = Template.bind({});
Small.args = {
  label: 'Small Button',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Large Button',
  size: 'lg',
};

// With Icons
export const WithPrefixIcon = Template.bind({});
WithPrefixIcon.args = {
  label: 'Settings',
  prefix: 'settings',
};

export const WithSuffixIcon = Template.bind({});
WithSuffixIcon.args = {
  label: 'Next',
  suffix: 'chevronRight',
};

// Full Width
export const FullWidth = Template.bind({});
FullWidth.args = {
  label: 'Full Width Button',
  fullWidth: true,
};

// Button Groups Example
export const ButtonGroup = () => html\`
  <div style="display: flex; gap: 8px;">
    <neo-button variant="primary">Save</neo-button>
    <neo-button variant="secondary">Cancel</neo-button>
  </div>
\`;

// Icon Button Example
export const IconButton = () => html\`
  <div style="display: flex; gap: 8px;">
    <neo-button variant="ghost" size="sm">
      <neo-icon slot="prefix" name="edit"></neo-icon>
    </neo-button>
    <neo-button variant="ghost" size="sm">
      <neo-icon slot="prefix" name="delete"></neo-icon>
    </neo-button>
    <neo-button variant="ghost" size="sm">
      <neo-icon slot="prefix" name="settings"></neo-icon>
    </neo-button>
  </div>
\`;

// Call to Action Example
export const CallToAction = () => html\`
  <div style="display: grid; gap: 16px; max-width: 300px;">
    <neo-button variant="primary" fullWidth>
      Get Started
      <neo-icon slot="suffix" name="arrowForward"></neo-icon>
    </neo-button>
    <neo-button variant="secondary" fullWidth>
      Learn More
    </neo-button>
  </div>
\`;

// Form Submit Example
export const FormSubmit = () => html\`
  <form onsubmit="event.preventDefault(); alert('Form submitted!');">
    <div style="display: flex; gap: 8px;">
      <neo-button type="submit" variant="primary">
        Submit
        <neo-icon slot="suffix" name="check"></neo-icon>
      </neo-button>
      <neo-button type="reset" variant="secondary">
        Reset
      </neo-button>
    </div>
  </form>
\`;

// Loading States Example
export const LoadingStates = () => html\`
  <div style="display: flex; gap: 8px;">
    <neo-button variant="primary" loading>Loading</neo-button>
    <neo-button variant="secondary" loading>Processing</neo-button>
    <neo-button variant="tertiary" loading>Saving</neo-button>
  </div>
\`; 