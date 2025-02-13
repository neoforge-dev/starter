import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./faq-accordion.js";

export default {
  title: "Marketing/FAQAccordion",
  component: "ui-faq-accordion",
  argTypes: {
    items: { control: "object" },
    variant: {
      control: "select",
      options: ["default", "minimal", "bordered", "card"],
    },
    layout: { control: "select", options: ["stack", "grid", "sections"] },
    columns: { control: "number" },
    defaultOpen: { control: "boolean" },
    allowMultiple: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-faq-accordion
    .items=${args.items}
    .variant=${args.variant}
    .layout=${args.layout}
    .columns=${args.columns}
    ?defaultOpen=${args.defaultOpen}
    ?allowMultiple=${args.allowMultiple}
  ></ui-faq-accordion>
`;

const defaultFAQs = [
  {
    question: "What is NeoForge?",
    answer:
      "NeoForge is a modern web development framework that combines the best practices of frontend and backend development. It provides a comprehensive set of tools and components to build scalable web applications quickly and efficiently.",
  },
  {
    question: "How do I get started with NeoForge?",
    answer:
      "Getting started with NeoForge is easy. First, install the CLI tool using npm or yarn. Then, create a new project using the CLI and follow our comprehensive documentation. We also provide starter templates for common use cases.",
  },
  {
    question: "Is NeoForge free to use?",
    answer:
      "Yes, NeoForge is open-source and free to use for both personal and commercial projects. We also offer premium support and enterprise features for organizations that need additional assistance.",
  },
  {
    question: "What are the system requirements?",
    answer:
      "NeoForge requires Node.js 16 or later and supports all modern browsers. For development, we recommend using VS Code with our official extension for the best experience.",
  },
  {
    question: "Can I contribute to NeoForge?",
    answer:
      "Absolutely! We welcome contributions from the community. Check out our contribution guidelines on GitHub to learn how you can help improve NeoForge.",
  },
];

const categorizedFAQs = [
  {
    category: "Getting Started",
    items: [
      {
        question: "What is NeoForge?",
        answer:
          "NeoForge is a modern web development framework that combines the best practices of frontend and backend development.",
      },
      {
        question: "How do I install NeoForge?",
        answer:
          "You can install NeoForge using npm: npm install neoforge, or yarn: yarn add neoforge",
      },
    ],
  },
  {
    category: "Features & Pricing",
    items: [
      {
        question: "What features are included?",
        answer:
          "NeoForge includes a comprehensive set of features including component library, state management, routing, and more.",
      },
      {
        question: "Is there a free tier?",
        answer:
          "Yes, NeoForge is open-source and free to use. We also offer premium support plans for enterprises.",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        question: "Where can I get help?",
        answer:
          "We offer documentation, community forums, and premium support options.",
      },
      {
        question: "Do you offer training?",
        answer:
          "Yes, we provide workshops and training sessions for teams. Contact us for more information.",
      },
    ],
  },
];

export const Stack = Template.bind({});
Stack.args = {
  variant: "default",
  layout: "stack",
  items: defaultFAQs,
  defaultOpen: false,
  allowMultiple: true,
};

export const Grid = Template.bind({});
Grid.args = {
  variant: "card",
  layout: "grid",
  columns: 2,
  items: defaultFAQs,
  defaultOpen: true,
  allowMultiple: true,
};

export const Sections = Template.bind({});
Sections.args = {
  variant: "bordered",
  layout: "sections",
  items: categorizedFAQs,
  defaultOpen: false,
  allowMultiple: true,
};

export const Minimal = Template.bind({});
Minimal.args = {
  variant: "minimal",
  layout: "stack",
  items: defaultFAQs,
  defaultOpen: false,
  allowMultiple: false,
};

export const SingleOpen = Template.bind({});
SingleOpen.args = {
  variant: "default",
  layout: "stack",
  items: defaultFAQs,
  defaultOpen: false,
  allowMultiple: false,
};
