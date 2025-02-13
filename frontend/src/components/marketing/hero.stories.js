import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./hero.js";

export default {
  title: "Marketing/Hero",
  component: "ui-hero",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "centered", "split", "gradient"],
    },
    title: { control: "text" },
    subtitle: { control: "text" },
    imageUrl: { control: "text" },
    imageAlt: { control: "text" },
    primaryAction: { control: "object" },
    secondaryAction: { control: "object" },
    background: { control: "text" },
    textColor: { control: "text" },
  },
};

const Template = (args) => html`
  <ui-hero
    .variant=${args.variant}
    .title=${args.title}
    .subtitle=${args.subtitle}
    .imageUrl=${args.imageUrl}
    .imageAlt=${args.imageAlt}
    .primaryAction=${args.primaryAction}
    .secondaryAction=${args.secondaryAction}
    .background=${args.background}
    .textColor=${args.textColor}
    @primary-click=${() => console.log("Primary action clicked")}
    @secondary-click=${() => console.log("Secondary action clicked")}
  ></ui-hero>
`;

export const Default = Template.bind({});
Default.args = {
  variant: "default",
  title: "Build faster with NeoForge",
  subtitle:
    "The modern starter kit for building production-ready web applications. Includes everything you need to get started.",
  imageUrl:
    "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80",
  imageAlt: "Hero image",
  primaryAction: {
    label: "Get Started",
    href: "/docs/getting-started",
  },
  secondaryAction: {
    label: "Learn More",
    href: "/about",
  },
};

export const Centered = Template.bind({});
Centered.args = {
  variant: "centered",
  title: "Welcome to NeoForge",
  subtitle:
    "A modern web development framework built for speed and scalability",
  primaryAction: {
    label: "Start Building",
    href: "/docs",
  },
  secondaryAction: {
    label: "View Demo",
    href: "/demo",
  },
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  textColor: "white",
};

export const Split = Template.bind({});
Split.args = {
  variant: "split",
  title: "Developer Experience First",
  subtitle:
    "NeoForge provides the best developer experience while maintaining production-grade features and performance.",
  imageUrl:
    "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80",
  imageAlt: "Developer working",
  primaryAction: {
    label: "Documentation",
    href: "/docs",
  },
  secondaryAction: {
    label: "GitHub",
    href: "https://github.com/neoforge",
  },
};

export const Gradient = Template.bind({});
Gradient.args = {
  variant: "gradient",
  title: "Build Something Amazing",
  subtitle:
    "Create stunning web applications with our modern toolkit and components",
  primaryAction: {
    label: "Get Started Free",
    href: "/signup",
  },
  secondaryAction: {
    label: "Watch Demo",
    href: "/demo",
  },
  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
  textColor: "white",
};

export const WithFeatures = Template.bind({});
WithFeatures.args = {
  ...Default.args,
  features: [
    {
      icon: "⚡️",
      title: "Fast",
      description: "Built for speed and performance",
    },
    {
      icon: "🛠️",
      title: "Flexible",
      description: "Customizable and extensible",
    },
    {
      icon: "🔒",
      title: "Secure",
      description: "Enterprise-grade security",
    },
  ],
};
