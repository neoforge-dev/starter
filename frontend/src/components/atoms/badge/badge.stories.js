import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './badge.js';

export default {
  title: 'Atoms/Badge',
  component: 'neo-badge',
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
      description: 'The visual style of the badge',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'The size of the badge',
    },
    rounded: {
      control: 'boolean',
      description: 'Whether the badge has rounded corners',
    },
    outlined: {
      control: 'boolean',
      description: 'Whether the badge has an outline style',
    },
    icon: {
      control: 'text',
      description: 'Icon name to display (if any)',
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
        component: 'A badge component for displaying status, labels, or counts.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

// Base Template
const Template = ({ label, variant, size, rounded, outlined, icon }) => html\`
  <neo-badge
    variant=\${ifDefined(variant)}
    size=\${ifDefined(size)}
    ?rounded=\${rounded}
    ?outlined=\${outlined}
    icon=\${ifDefined(icon)}
  >
    \${label}
  </neo-badge>
\`;

// Stories
export const Default = Template.bind({});
Default.args = {
  label: 'Default Badge',
  variant: 'default',
  size: 'medium',
};

export const Primary = Template.bind({});
Primary.args = {
  label: 'Primary',
  variant: 'primary',
  size: 'medium',
};

export const Success = Template.bind({});
Success.args = {
  label: 'Success',
  variant: 'success',
  size: 'medium',
};

export const Warning = Template.bind({});
Warning.args = {
  label: 'Warning',
  variant: 'warning',
  size: 'medium',
};

export const Error = Template.bind({});
Error.args = {
  label: 'Error',
  variant: 'error',
  size: 'medium',
};

export const Small = Template.bind({});
Small.args = {
  label: 'Small',
  variant: 'default',
  size: 'small',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Large',
  variant: 'default',
  size: 'large',
};

export const Rounded = Template.bind({});
Rounded.args = {
  label: 'Rounded',
  variant: 'primary',
  rounded: true,
};

export const Outlined = Template.bind({});
Outlined.args = {
  label: 'Outlined',
  variant: 'primary',
  outlined: true,
};

// Badge with Icon
export const WithIcon = Template.bind({});
WithIcon.args = {
  label: 'New',
  variant: 'primary',
  icon: 'star',
};

// Badge Group Example
export const BadgeGroup = () => html\`
  <div style="display: flex; gap: 8px; align-items: center;">
    <neo-badge variant="success" icon="check">Completed</neo-badge>
    <neo-badge variant="warning" icon="warning">Pending</neo-badge>
    <neo-badge variant="error" icon="error">Failed</neo-badge>
  </div>
\`;

// Status Indicator Example
export const StatusIndicator = () => html\`
  <div style="display: flex; gap: 16px; align-items: center;">
    <neo-badge variant="success" size="small" rounded></neo-badge>
    <span>Online</span>
  </div>
\`;

// Counter Example
export const Counter = () => html\`
  <div style="position: relative; display: inline-block;">
    <neo-button variant="primary">
      Notifications
      <neo-badge 
        variant="error" 
        size="small" 
        rounded 
        style="position: absolute; top: -8px; right: -8px;"
      >
        5
      </neo-badge>
    </neo-button>
  </div>
\`; 