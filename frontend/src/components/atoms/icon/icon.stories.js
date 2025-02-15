import { html } from "lit";
import "./icon.js";

export default {
  title: "Atoms/Icon",
  component: "neo-icon",
  argTypes: {
    name: {
      control: "select",
      options: [
        "user",
        "settings",
        "notification",
        "search",
        "menu",
        "close",
        "check",
        "error",
        "warning",
        "info",
        "success",
      ],
      description: "Name of the icon to display",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "Size of the icon",
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "success", "error", "warning"],
      description: "Color of the icon",
    },
    customSize: {
      control: "text",
      description: "Custom size in px or rem",
    },
    label: {
      control: "text",
      description: "Accessible label for the icon",
    },
    decorative: {
      control: "boolean",
      description: "Whether the icon is decorative only",
    },
    loading: {
      control: "boolean",
      description: "Whether to show loading animation",
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/...",
    },
    docs: {
      description: {
        component:
          "An icon component that supports various sizes, colors, and states.",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "aria-label",
            enabled: true,
          },
        ],
      },
    },
  },
};

const Template = (args) => html`
  <neo-icon
    name="${args.name || "user"}"
    size="${args.size || "md"}"
    color="${args.color || ""}"
    customSize="${args.customSize || ""}"
    label="${args.label || ""}"
    ?decorative="${args.decorative}"
    ?loading="${args.loading}"
  ></neo-icon>
`;

export const Default = Template.bind({});
Default.args = {
  name: "user",
  size: "md",
};

export const Colored = Template.bind({});
Colored.args = {
  name: "notification",
  color: "primary",
  size: "lg",
};

export const CustomSized = Template.bind({});
CustomSized.args = {
  name: "settings",
  customSize: "48px",
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  name: "info",
  label: "Information Icon",
  size: "lg",
};

export const Decorative = Template.bind({});
Decorative.args = {
  name: "menu",
  decorative: true,
};

export const Loading = Template.bind({});
Loading.args = {
  name: "settings",
  loading: true,
  size: "lg",
};

// Icon Grid Example
export const IconGrid = () => html`
  <div
    style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; text-align: center;"
  >
    <div>
      <neo-icon name="user" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 14px;">user</div>
    </div>
    <div>
      <neo-icon name="settings" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 14px;">settings</div>
    </div>
    <div>
      <neo-icon name="notification" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 14px;">notification</div>
    </div>
    <div>
      <neo-icon name="search" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 14px;">search</div>
    </div>
    <div>
      <neo-icon name="menu" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 14px;">menu</div>
    </div>
    <div>
      <neo-icon name="close" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 14px;">close</div>
    </div>
  </div>
`;

// Size Comparison
export const SizeComparison = () => html`
  <div style="display: flex; align-items: center; gap: 16px;">
    <div>
      <neo-icon name="user" size="sm"></neo-icon>
      <div style="margin-top: 8px; font-size: 12px;">Small</div>
    </div>
    <div>
      <neo-icon name="user" size="md"></neo-icon>
      <div style="margin-top: 8px; font-size: 12px;">Medium</div>
    </div>
    <div>
      <neo-icon name="user" size="lg"></neo-icon>
      <div style="margin-top: 8px; font-size: 12px;">Large</div>
    </div>
    <div>
      <neo-icon name="user" size="xl"></neo-icon>
      <div style="margin-top: 8px; font-size: 12px;">Extra Large</div>
    </div>
  </div>
`;

// Color Variants
export const ColorVariants = () => html`
  <div style="display: flex; gap: 16px;">
    <neo-icon name="info" size="lg" color="primary"></neo-icon>
    <neo-icon name="check" size="lg" color="success"></neo-icon>
    <neo-icon name="warning" size="lg" color="warning"></neo-icon>
    <neo-icon name="error" size="lg" color="error"></neo-icon>
  </div>
`;

// Button with Icon
export const ButtonWithIcon = () => html`
  <button
    style="
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: var(--color-primary);
    color: white;
    cursor: pointer;
  "
  >
    <neo-icon name="settings" size="sm" decorative></neo-icon>
    Settings
  </button>
`;
