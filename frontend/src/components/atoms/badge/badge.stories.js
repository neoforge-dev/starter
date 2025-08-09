import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ifDefined } from 'lit/directives/if-defined.js';
import './badge.js';
import '../icon/icon.js';

export default {
  title: 'Atoms/Badge',
  component: 'neo-badge',
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'error', 'warning', 'info'],
      description: 'The variant style of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the badge',
    },
    rounded: {
      control: 'boolean',
      description: 'Whether the badge has fully rounded corners',
    },
    outlined: {
      control: 'boolean',
      description: 'Whether the badge has an outlined style',
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
        component: 'A badge component that supports various styles and states.',
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

const Template = (args) => html`
  <neo-badge
    variant="${args.variant || 'default'}"
    size="${args.size || 'md'}"
    ?rounded="${args.rounded}"
    ?outlined="${args.outlined}"
  >
    ${args.prefix ? html`<neo-icon slot="prefix" name="${args.prefix}"></neo-icon>` : ""}
    ${args.label || "Badge"}
    ${args.suffix ? html`<neo-icon slot="suffix" name="${args.suffix}"></neo-icon>` : ""}
  </neo-badge>
`;

// Stories
export const Default = Template.bind({});
Default.args = {
  label: 'Default',
};

export const Primary = Template.bind({});
Primary.args = {
  label: 'Primary',
  variant: 'primary',
};

export const Success = Template.bind({});
Success.args = {
  label: 'Success',
  variant: 'success',
  prefix: 'check',
};

export const Error = Template.bind({});
Error.args = {
  label: 'Error',
  variant: 'error',
  prefix: 'error',
};

export const Warning = Template.bind({});
Warning.args = {
  label: 'Warning',
  variant: 'warning',
  prefix: 'warning',
};

export const Info = Template.bind({});
Info.args = {
  label: 'Info',
  variant: 'info',
  prefix: 'info',
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

export const Small = Template.bind({});
Small.args = {
  label: 'Small',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Large',
  size: 'lg',
};

// Badge Group Example
export const BadgeGroup = () => html`
  <div style="display: flex; gap: 8px; align-items: center;">
    <neo-badge variant="primary">New</neo-badge>
    <neo-badge variant="success">
      <neo-icon slot="prefix" name="check"></neo-icon>
      Active
    </neo-badge>
    <neo-badge variant="warning" rounded>
      <neo-icon slot="prefix" name="warning"></neo-icon>
      Warning
    </neo-badge>
    <neo-badge variant="error">
      <neo-icon slot="prefix" name="error"></neo-icon>
      Error
    </neo-badge>
  </div>
`;

// Status Badges Example
export const StatusBadges = () => html`
  <div style="display: grid; gap: 16px;">
    <div style="display: flex; gap: 8px; align-items: center;">
      <neo-badge variant="success" size="sm" rounded>Active</neo-badge>
      <span>User is currently active</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <neo-badge variant="warning" size="sm" rounded>Away</neo-badge>
      <span>User is away</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <neo-badge variant="error" size="sm" rounded>Offline</neo-badge>
      <span>User is offline</span>
    </div>
  </div>
`;

// Notification Badges Example
export const NotificationBadges = () => html`
  <div style="display: flex; gap: 24px;">
    <div style="position: relative; display: inline-block;">
      <neo-icon name="notification" size="lg"></neo-icon>
      <neo-badge
        variant="error"
        size="sm"
        rounded
        style="position: absolute; top: -4px; right: -4px;"
      >
        3
      </neo-badge>
    </div>
    <div style="position: relative; display: inline-block;">
      <neo-icon name="mail" size="lg"></neo-icon>
      <neo-badge
        variant="primary"
        size="sm"
        rounded
        style="position: absolute; top: -4px; right: -4px;"
      >
        12
      </neo-badge>
    </div>
    <div style="position: relative; display: inline-block;">
      <neo-icon name="chat" size="lg"></neo-icon>
      <neo-badge
        variant="success"
        size="sm"
        rounded
        style="position: absolute; top: -4px; right: -4px;"
      >
        5
      </neo-badge>
    </div>
  </div>
`;

// Custom Styled Badges Example
export const CustomStyledBadges = () => html`
  <div style="display: flex; gap: 8px;">
    <neo-badge
      style="--badge-bg-color: #8B5CF6; --badge-text-color: white;"
      rounded
    >
      Custom
    </neo-badge>
    <neo-badge
      style="--badge-bg-color: #EC4899; --badge-text-color: white;"
      rounded
    >
      Styled
    </neo-badge>
    <neo-badge
      style="--badge-bg-color: #F59E0B; --badge-text-color: white;"
      rounded
    >
      Badges
    </neo-badge>
  </div>
`; 