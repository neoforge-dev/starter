import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./pricing-tables.js";

export default {
  title: "Marketing/PricingTables",
  component: "ui-pricing-tables",
  argTypes: {
    plans: { control: "object" },
    layout: {
      control: "select",
      options: ["simple", "feature-rich", "comparison"],
    },
    variant: {
      control: "select",
      options: ["default", "gradient", "bordered"],
    },
    currency: { control: "text" },
    interval: { control: "select", options: ["monthly", "yearly"] },
    showToggle: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-pricing-tables
    .plans=${args.plans}
    .layout=${args.layout}
    .variant=${args.variant}
    .currency=${args.currency}
    .interval=${args.interval}
    ?showToggle=${args.showToggle}
    @interval-change=${(e) => console.log("Interval changed:", e.detail)}
    @plan-selected=${(e) => console.log("Plan selected:", e.detail)}
  ></ui-pricing-tables>
`;

const defaultPlans = [
  {
    name: "Starter",
    description: "Perfect for side projects and small applications",
    price: {
      monthly: 9,
      yearly: 89,
    },
    features: [
      "5 Team Members",
      "10 Projects",
      "10GB Storage",
      "Basic Support",
    ],
    cta: {
      label: "Start Free Trial",
      href: "/signup?plan=starter",
    },
  },
  {
    name: "Pro",
    description: "Best for growing teams and businesses",
    price: {
      monthly: 29,
      yearly: 289,
    },
    features: [
      "Unlimited Team Members",
      "Unlimited Projects",
      "100GB Storage",
      "Priority Support",
      "Advanced Analytics",
      "Custom Domains",
    ],
    popular: true,
    cta: {
      label: "Get Started",
      href: "/signup?plan=pro",
    },
  },
  {
    name: "Enterprise",
    description: "For large organizations with advanced needs",
    price: {
      monthly: 99,
      yearly: 989,
    },
    features: [
      "Everything in Pro",
      "Dedicated Support",
      "Custom Integrations",
      "SLA Guarantee",
      "Advanced Security",
      "Custom Contracts",
    ],
    cta: {
      label: "Contact Sales",
      href: "/contact",
    },
  },
];

export const Simple = Template.bind({});
Simple.args = {
  layout: "simple",
  variant: "default",
  currency: "$",
  interval: "monthly",
  showToggle: true,
  plans: defaultPlans,
};

export const FeatureRich = Template.bind({});
FeatureRich.args = {
  layout: "feature-rich",
  variant: "gradient",
  currency: "$",
  interval: "monthly",
  showToggle: true,
  plans: defaultPlans.map((plan) => ({
    ...plan,
    features: plan.features.map((feature) => ({
      name: feature,
      included: true,
      tooltip: `Learn more about ${feature}`,
    })),
  })),
};

export const Comparison = Template.bind({});
Comparison.args = {
  layout: "comparison",
  variant: "bordered",
  currency: "$",
  interval: "yearly",
  showToggle: true,
  plans: defaultPlans.map((plan) => ({
    ...plan,
    features: [
      {
        category: "Core Features",
        items: [
          {
            name: "Projects",
            value: plan.name === "Starter" ? "10" : "Unlimited",
          },
          {
            name: "Storage",
            value: plan.name === "Starter" ? "10GB" : "100GB",
          },
          {
            name: "Team Members",
            value: plan.name === "Starter" ? "5" : "Unlimited",
          },
        ],
      },
      {
        category: "Support",
        items: [
          {
            name: "Support Level",
            value:
              plan.name === "Starter"
                ? "Basic"
                : plan.name === "Pro"
                  ? "Priority"
                  : "Dedicated",
          },
          { name: "SLA", value: plan.name === "Enterprise" ? "99.9%" : "—" },
          {
            name: "Custom Contracts",
            value: plan.name === "Enterprise" ? "✓" : "—",
          },
        ],
      },
      {
        category: "Security",
        items: [
          { name: "2FA", value: "✓" },
          { name: "SSO", value: plan.name === "Starter" ? "—" : "✓" },
          { name: "Audit Logs", value: plan.name === "Enterprise" ? "✓" : "—" },
        ],
      },
    ],
  })),
};
