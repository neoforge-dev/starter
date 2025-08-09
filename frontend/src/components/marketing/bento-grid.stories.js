import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./bento-grid.js";

export default {
  title: "Marketing/BentoGrid",
  component: "ui-bento-grid",
  argTypes: {
    items: { control: "object" },
    columns: { control: "number" },
    gap: { control: "text" },
    minHeight: { control: "text" },
    variant: {
      control: "select",
      options: ["default", "gradient", "bordered"],
    },
  },
};

const Template = (args) => html`
  <ui-bento-grid
    .items=${args.items}
    .columns=${args.columns}
    .gap=${args.gap}
    .minHeight=${args.minHeight}
    .variant=${args.variant}
  ></ui-bento-grid>
`;

export const Default = Template.bind({});
Default.args = {
  columns: 3,
  gap: "1rem",
  minHeight: "200px",
  variant: "default",
  items: [
    {
      title: "Modern Architecture",
      description: "Built with the latest web standards and best practices",
      icon: "🏗️",
      span: { rows: 1, cols: 1 },
      color: "#2563eb",
    },
    {
      title: "Developer Experience",
      description: "Optimized workflow with hot reloading and instant feedback",
      icon: "👩‍💻",
      span: { rows: 1, cols: 2 },
      color: "#7c3aed",
    },
    {
      title: "Performance First",
      description: "Blazing fast load times and smooth interactions",
      icon: "⚡",
      span: { rows: 2, cols: 1 },
      color: "#059669",
    },
    {
      title: "Scalable & Secure",
      description: "Enterprise-grade security and scalability built-in",
      icon: "🔒",
      span: { rows: 1, cols: 1 },
      color: "#dc2626",
    },
    {
      title: "Modern Tooling",
      description: "Latest development tools and frameworks",
      icon: "🛠️",
      span: { rows: 1, cols: 1 },
      color: "#0891b2",
    },
  ],
};

export const Gradient = Template.bind({});
Gradient.args = {
  ...Default.args,
  variant: "gradient",
  items: Default.args.items.map((item) => ({
    ...item,
    gradient: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
  })),
};

export const Bordered = Template.bind({});
Bordered.args = {
  ...Default.args,
  variant: "bordered",
  items: Default.args.items.map((item) => ({
    ...item,
    borderColor: item.color,
  })),
};

export const Features = Template.bind({});
Features.args = {
  columns: 4,
  gap: "1.5rem",
  minHeight: "250px",
  variant: "gradient",
  items: [
    {
      title: "Lightning Fast",
      description: "Optimized for speed and performance",
      icon: "⚡",
      span: { rows: 2, cols: 2 },
      gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    {
      title: "Responsive",
      description: "Looks great on all devices",
      icon: "📱",
      span: { rows: 1, cols: 1 },
      gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    },
    {
      title: "Accessible",
      description: "Built with a11y in mind",
      icon: "♿",
      span: { rows: 1, cols: 1 },
      gradient: "linear-gradient(135deg, #ec4899, #be185d)",
    },
    {
      title: "Modern Stack",
      description: "Using the latest web technologies",
      icon: "🚀",
      span: { rows: 1, cols: 2 },
      gradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
      title: "Developer Tools",
      description: "Great DX out of the box",
      icon: "🛠️",
      span: { rows: 1, cols: 1 },
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    {
      title: "Community",
      description: "Active and helpful community",
      icon: "👥",
      span: { rows: 1, cols: 1 },
      gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    },
  ],
};
