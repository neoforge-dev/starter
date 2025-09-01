export default {
  title: "Atoms/Switch",
  component: "neo-switch",
  parameters: {
    docs: {
      description: {
        component: `
The Switch component provides a toggle interface for boolean values with full keyboard accessibility.

## Features
- Keyboard accessible (space/enter to toggle)
- ARIA attributes for screen readers
- Smooth animation transitions
- Multiple sizes (sm, md, lg)
- Disabled state support
- Custom labels for on/off states
- Form integration with name/value

## Usage
Use this component for settings, preferences, and other boolean controls where the state change is immediate.
        `,
      },
    },
  },
  argTypes: {
    checked: {
      control: "boolean",
      description: "Whether the switch is checked/on",
    },
    disabled: {
      control: "boolean",
      description: "Whether the switch is disabled",
    },
    label: {
      control: "text",
      description: "Label text for the switch",
    },
    onLabel: {
      control: "text",
      description: "Custom label for the 'on' state",
    },
    offLabel: {
      control: "text",
      description: "Custom label for the 'off' state",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size of the switch",
    },
    name: {
      control: "text",
      description: "Name attribute for form submission",
    },
    value: {
      control: "text",
      description: "Value attribute for form submission",
    },
  },
};

const Template = (args) => {
  return `
    <neo-switch
      ${args.checked ? "checked" : ""}
      ${args.disabled ? "disabled" : ""}
      ${args.label ? `label="${args.label}"` : ""}
      ${args.onLabel ? `on-label="${args.onLabel}"` : ""}
      ${args.offLabel ? `off-label="${args.offLabel}"` : ""}
      ${args.size ? `size="${args.size}"` : ""}
      ${args.name ? `name="${args.name}"` : ""}
      ${args.value ? `value="${args.value}"` : ""}
    ></neo-switch>
  `;
};

export const Default = Template.bind({});
Default.args = {};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: "Enable notifications",
};

export const Checked = Template.bind({});
Checked.args = {
  checked: true,
  label: "Dark mode",
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
  label: "Disabled switch",
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  checked: true,
  disabled: true,
  label: "Disabled checked switch",
};

export const WithStateLabels = Template.bind({});
WithStateLabels.args = {
  onLabel: "On",
  offLabel: "Off",
  label: "Auto-save",
};

export const SmallSize = Template.bind({});
SmallSize.args = {
  size: "sm",
  label: "Small switch",
};

export const LargeSize = Template.bind({});
LargeSize.args = {
  size: "lg",
  label: "Large switch",
  checked: true,
};

export const FormIntegration = Template.bind({});
FormIntegration.args = {
  name: "notifications",
  value: "enabled",
  label: "Email notifications",
  checked: true,
};

export const AllSizes = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <neo-switch size="sm" label="Small"></neo-switch>
        <span style="font-size: 0.875rem; color: #6b7280;">32x18px</span>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <neo-switch size="md" label="Medium" checked></neo-switch>
        <span style="font-size: 0.875rem; color: #6b7280;">44x24px</span>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <neo-switch size="lg" label="Large"></neo-switch>
        <span style="font-size: 0.875rem; color: #6b7280;">52x28px</span>
      </div>
    </div>
  `;
};

AllSizes.parameters = {
  docs: {
    description: {
      story: "Different sizes available for the switch component.",
    },
  },
};

export const SettingsPanel = () => {
  return `
    <div style="max-width: 400px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
      <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 600;">Settings</h3>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <neo-switch label="Enable notifications" checked></neo-switch>
        <neo-switch label="Auto-save documents" checked></neo-switch>
        <neo-switch label="Dark mode"></neo-switch>
        <neo-switch label="Experimental features" disabled></neo-switch>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0.5rem 0;">

        <neo-switch
          label="Privacy mode"
          on-label="Private"
          off-label="Public"
          size="lg"
        ></neo-switch>
      </div>
    </div>
  `;
};

SettingsPanel.parameters = {
  docs: {
    description: {
      story: "Example of switches used in a settings panel.",
    },
  },
};
