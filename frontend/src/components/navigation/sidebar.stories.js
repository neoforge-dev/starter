import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./sidebar.js";

export default {
  title: "Navigation/Sidebar",
  component: "ui-sidebar",
  argTypes: {
    variant: { control: "select", options: ["default", "compact", "expanded"] },
    collapsible: { control: "boolean" },
    collapsed: { control: "boolean" },
    items: { control: "object" },
  },
};

const Template = (args) => html`
  <ui-sidebar
    .variant=${args.variant}
    ?collapsible=${args.collapsible}
    ?collapsed=${args.collapsed}
    .items=${args.items}
    @navigate=${(e) => console.log("Navigate:", e.detail)}
  ></ui-sidebar>
`;

export const Default = Template.bind({});
Default.args = {
  variant: "default",
  collapsible: true,
  collapsed: false,
  items: [
    {
      label: "Dashboard",
      icon: "📊",
      href: "/dashboard",
    },
    {
      label: "Analytics",
      icon: "📈",
      href: "/analytics",
    },
    {
      label: "Settings",
      icon: "⚙️",
      items: [
        { label: "Profile", href: "/settings/profile" },
        { label: "Security", href: "/settings/security" },
        { label: "Preferences", href: "/settings/preferences" },
      ],
    },
    {
      label: "Documentation",
      icon: "📚",
      items: [
        { label: "Getting Started", href: "/docs/getting-started" },
        { label: "Components", href: "/docs/components" },
        { label: "API Reference", href: "/docs/api" },
      ],
    },
  ],
};

export const Compact = Template.bind({});
Compact.args = {
  ...Default.args,
  variant: "compact",
};

export const Expanded = Template.bind({});
Expanded.args = {
  ...Default.args,
  variant: "expanded",
};

export const WithBadges = Template.bind({});
WithBadges.args = {
  ...Default.args,
  items: [
    {
      label: "Dashboard",
      icon: "📊",
      href: "/dashboard",
    },
    {
      label: "Messages",
      icon: "✉️",
      href: "/messages",
      badge: {
        label: "3",
        variant: "primary",
      },
    },
    {
      label: "Tasks",
      icon: "✓",
      href: "/tasks",
      badge: {
        label: "12",
        variant: "warning",
      },
    },
    {
      label: "Notifications",
      icon: "🔔",
      href: "/notifications",
      badge: {
        label: "New",
        variant: "success",
      },
    },
  ],
};

export const WithActiveItem = Template.bind({});
WithActiveItem.args = {
  ...Default.args,
  items: Default.args.items.map((item, index) =>
    index === 0 ? { ...item, active: true } : item
  ),
};

export const WithDividers = Template.bind({});
WithDividers.args = {
  ...Default.args,
  items: [
    {
      label: "Main",
      type: "header",
    },
    {
      label: "Dashboard",
      icon: "📊",
      href: "/dashboard",
    },
    {
      label: "Analytics",
      icon: "📈",
      href: "/analytics",
    },
    {
      type: "divider",
    },
    {
      label: "Settings",
      type: "header",
    },
    {
      label: "Profile",
      icon: "👤",
      href: "/settings/profile",
    },
    {
      label: "Security",
      icon: "🔒",
      href: "/settings/security",
    },
  ],
};
