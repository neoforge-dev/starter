import { html } from "lit";
import "./icon.js";
import { icons } from "./icons.js";

export default {
  title: "Atoms/Icon",
  component: "neo-icon",
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: { type: "select" },
      options: Object.keys(icons),
      description: "Name of the icon to display",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "xl"],
      description: "Size of the icon",
    },
    color: {
      control: { type: "select" },
      options: ["primary", "secondary", "success", "error", "warning"],
      description: "Color variant of the icon",
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
};

// Base template for all stories
const Template = (args) => {
  return html`
    <neo-icon
      .name=${args.name}
      .size=${args.size}
      .color=${args.color}
      .customSize=${args.customSize}
      .label=${args.label}
      ?decorative=${args.decorative}
      ?loading=${args.loading}
    ></neo-icon>
  `;
};

// Default icon
export const Default = Template.bind({});
Default.args = {
  name: "user",
  size: "md",
  color: undefined,
  customSize: undefined,
  label: "User",
  decorative: false,
  loading: false,
};

// Icon sizes
export const Small = Template.bind({});
Small.args = {
  ...Default.args,
  size: "sm",
};

export const Medium = Template.bind({});
Medium.args = {
  ...Default.args,
  size: "md",
};

export const Large = Template.bind({});
Large.args = {
  ...Default.args,
  size: "lg",
};

export const ExtraLarge = Template.bind({});
ExtraLarge.args = {
  ...Default.args,
  size: "xl",
};

export const CustomSize = Template.bind({});
CustomSize.args = {
  ...Default.args,
  customSize: "64px",
};

// Icon colors
export const PrimaryColor = Template.bind({});
PrimaryColor.args = {
  ...Default.args,
  color: "primary",
};

export const SecondaryColor = Template.bind({});
SecondaryColor.args = {
  ...Default.args,
  color: "secondary",
};

export const SuccessColor = Template.bind({});
SuccessColor.args = {
  ...Default.args,
  name: "success",
  color: "success",
};

export const ErrorColor = Template.bind({});
ErrorColor.args = {
  ...Default.args,
  name: "error",
  color: "error",
};

export const WarningColor = Template.bind({});
WarningColor.args = {
  ...Default.args,
  name: "warning",
  color: "warning",
};

// Icon states
export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  loading: true,
};

export const Decorative = Template.bind({});
Decorative.args = {
  ...Default.args,
  decorative: true,
};

// Icon gallery
export const IconGallery = () => {
  return html`
    <style>
      .icon-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 16px;
      }
      .icon-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        border: 1px solid #eee;
        border-radius: 4px;
      }
      .icon-name {
        margin-top: 8px;
        font-size: 12px;
        text-align: center;
      }
    </style>
    <div class="icon-gallery">
      ${Object.keys(icons).map(
        (name) => html`
          <div class="icon-item">
            <neo-icon .name=${name} size="md"></neo-icon>
            <div class="icon-name">${name}</div>
          </div>
        `
      )}
    </div>
  `;
};
