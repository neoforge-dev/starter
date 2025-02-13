import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './spinner.js';

export default {
  title: 'Atoms/Spinner',
  component: 'neo-spinner',
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'The size of the spinner',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'light', 'dark'],
      description: 'The color variant of the spinner',
    },
    speed: {
      control: 'select',
      options: ['slow', 'normal', 'fast'],
      description: 'The animation speed of the spinner',
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
    docs: {
      description: {
        component: 'A versatile loading spinner component that provides visual feedback during loading states.',
      },
    },
    a11y: {
      config: {
        rules: [
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
const Template = ({ size, variant, speed, label }) => html\`
  <neo-spinner
    size=\${ifDefined(size)}
    variant=\${ifDefined(variant)}
    speed=\${ifDefined(speed)}
    label=\${ifDefined(label)}
  ></neo-spinner>
\`;

// Stories
export const Default = Template.bind({});
Default.args = {
  size: 'medium',
  variant: 'primary',
  speed: 'normal',
  label: 'Loading...',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  variant: 'primary',
  speed: 'normal',
  label: 'Loading...',
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  variant: 'primary',
  speed: 'normal',
  label: 'Loading...',
};

export const Secondary = Template.bind({});
Secondary.args = {
  size: 'medium',
  variant: 'secondary',
  speed: 'normal',
  label: 'Loading...',
};

export const FastSpeed = Template.bind({});
FastSpeed.args = {
  size: 'medium',
  variant: 'primary',
  speed: 'fast',
  label: 'Processing...',
};

export const SlowSpeed = Template.bind({});
SlowSpeed.args = {
  size: 'medium',
  variant: 'primary',
  speed: 'slow',
  label: 'Please wait...',
};

// Spinner with Text
export const WithText = () => html\`
  <div style="display: flex; align-items: center; gap: 8px;">
    <neo-spinner size="small"></neo-spinner>
    <span>Loading content...</span>
  </div>
\`;

// Button with Spinner
export const ButtonSpinner = () => html\`
  <neo-button variant="primary" disabled>
    <neo-spinner size="small" variant="light"></neo-spinner>
    Saving...
  </neo-button>
\`;

// Card Loading State
export const CardLoading = () => html\`
  <neo-card style="min-height: 200px; display: flex; justify-content: center; align-items: center;">
    <neo-spinner size="large" variant="primary"></neo-spinner>
  </neo-card>
\`;

// Multiple Sizes Example
export const SpinnerSizes = () => html\`
  <div style="display: flex; gap: 16px; align-items: center;">
    <neo-spinner size="small" label="Small spinner"></neo-spinner>
    <neo-spinner size="medium" label="Medium spinner"></neo-spinner>
    <neo-spinner size="large" label="Large spinner"></neo-spinner>
  </div>
\`;

// Overlay Example
export const LoadingOverlay = () => html\`
  <div style="position: relative; width: 300px; height: 200px; background: var(--color-surface); border-radius: var(--radius-md);">
    <div style="
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255, 255, 255, 0.9);
    ">
      <neo-spinner size="large" variant="primary"></neo-spinner>
    </div>
  </div>
\`; 