import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './button.js';

export default {
  title: 'Atoms/Button',
  component: 'neo-button',
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'text', 'icon'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
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
        component: 'A versatile button component that follows atomic design principles.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'button-name',
            enabled: true,
          },
        ],
      },
    },
  },
};

// Base Template
const Template = ({ label, variant, size, disabled, loading }) => html\`
  <neo-button
    variant=\${ifDefined(variant)}
    size=\${ifDefined(size)}
    ?disabled=\${disabled}
    ?loading=\${loading}
    @click=\${() => console.log('Button clicked')}
  >
    \${label}
  </neo-button>
\`;

// Stories
export const Primary = Template.bind({});
Primary.args = {
  label: 'Primary Button',
  variant: 'primary',
  size: 'medium',
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: 'Secondary Button',
  variant: 'secondary',
  size: 'medium',
};

export const Text = Template.bind({});
Text.args = {
  label: 'Text Button',
  variant: 'text',
  size: 'medium',
};

export const Small = Template.bind({});
Small.args = {
  label: 'Small Button',
  variant: 'primary',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Large Button',
  variant: 'primary',
  size: 'large',
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Button',
  variant: 'primary',
  disabled: true,
};

export const Loading = Template.bind({});
Loading.args = {
  label: 'Loading Button',
  variant: 'primary',
  loading: true,
};

// Button Group Example
export const ButtonGroup = () => html\`
  <div style="display: flex; gap: 8px;">
    <neo-button variant="primary">Primary</neo-button>
    <neo-button variant="secondary">Secondary</neo-button>
    <neo-button variant="text">Text</neo-button>
  </div>
\`;

// Icon Button Example
export const IconButton = () => html\`
  <neo-button variant="icon">
    <neo-icon name="settings"></neo-icon>
  </neo-button>
\`;

// Responsive Button Example
export const ResponsiveButton = () => html\`
  <neo-button class="responsive-button">
    <span class="desktop-text">Desktop Label</span>
    <span class="mobile-text">Mobile</span>
  </neo-button>
  <style>
    .responsive-button .mobile-text {
      display: none;
    }
    @media (max-width: 768px) {
      .responsive-button .desktop-text {
        display: none;
      }
      .responsive-button .mobile-text {
        display: inline;
      }
    }
  </style>
\`; 