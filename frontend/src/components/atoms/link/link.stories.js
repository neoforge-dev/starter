import {   html   } from 'lit';
import "./link.js";

export default {
  title: "Atoms/Link",
  component: "neo-link",
  tags: ["autodocs"],
  argTypes: {
    href: { control: "text" },
    variant: {
      control: { type: "select" },
      options: ["default", "primary", "secondary", "subtle"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    underline: {
      control: { type: "select" },
      options: ["none", "hover", "always"],
    },
    disabled: { control: "boolean" },
    external: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

// Base template for all stories
const Template = (args) => {
  return html`
    <neo-link
      .href=${args.href}
      .variant=${args.variant}
      .size=${args.size}
      .underline=${args.underline}
      ?disabled=${args.disabled}
      ?external=${args.external}
      @click=${args.onClick}
    >
      ${args.content}
    </neo-link>
  `;
};

// Default link
export const Default = Template.bind({});
Default.args = {
  href: "#",
  variant: "default",
  size: "md",
  underline: "hover",
  disabled: false,
  external: false,
  content: "Default Link",
};

// Primary link
export const Primary = Template.bind({});
Primary.args = {
  ...Default.args,
  variant: "primary",
  content: "Primary Link",
};

// Secondary link
export const Secondary = Template.bind({});
Secondary.args = {
  ...Default.args,
  variant: "secondary",
  content: "Secondary Link",
};

// Subtle link
export const Subtle = Template.bind({});
Subtle.args = {
  ...Default.args,
  variant: "subtle",
  content: "Subtle Link",
};

// Link sizes
export const Small = Template.bind({});
Small.args = {
  ...Default.args,
  size: "sm",
  content: "Small Link",
};

export const Medium = Template.bind({});
Medium.args = {
  ...Default.args,
  size: "md",
  content: "Medium Link",
};

export const Large = Template.bind({});
Large.args = {
  ...Default.args,
  size: "lg",
  content: "Large Link",
};

// Underline variants
export const NoUnderline = Template.bind({});
NoUnderline.args = {
  ...Default.args,
  underline: "none",
  content: "No Underline",
};

export const HoverUnderline = Template.bind({});
HoverUnderline.args = {
  ...Default.args,
  underline: "hover",
  content: "Hover Underline",
};

export const AlwaysUnderline = Template.bind({});
AlwaysUnderline.args = {
  ...Default.args,
  underline: "always",
  content: "Always Underline",
};

// States
export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
  content: "Disabled Link",
};

export const External = Template.bind({});
External.args = {
  ...Default.args,
  href: "https://example.com",
  external: true,
  content: "External Link",
};

// With icons
export const WithPrefixIcon = (args) => {
  return html`
    <neo-link
      .href=${args.href}
      .variant=${args.variant}
      .size=${args.size}
      .underline=${args.underline}
      ?disabled=${args.disabled}
      ?external=${args.external}
      @click=${args.onClick}
    >
      <span slot="prefix">🔗</span>
      ${args.content}
    </neo-link>
  `;
};

WithPrefixIcon.args = {
  ...Default.args,
  content: "Link with Prefix Icon",
};

export const WithSuffixIcon = (args) => {
  return html`
    <neo-link
      .href=${args.href}
      .variant=${args.variant}
      .size=${args.size}
      .underline=${args.underline}
      ?disabled=${args.disabled}
      ?external=${args.external}
      @click=${args.onClick}
    >
      ${args.content}
      <span slot="suffix">→</span>
    </neo-link>
  `;
};

WithSuffixIcon.args = {
  ...Default.args,
  content: "Link with Suffix Icon",
};
