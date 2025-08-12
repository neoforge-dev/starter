import {  html  } from 'lit';
import "./layout.js";

export default {
  title: "Layout/System",
  component: "ui-layout",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "dashboard", "landing", "docs"],
    },
    fluid: { control: "boolean" },
    gap: { control: "select", options: ["none", "small", "medium", "large"] },
    padding: {
      control: "select",
      options: ["none", "small", "medium", "large"],
    },
  },
};

const Template = (args) => html`
  <ui-layout
    .variant=${args.variant}
    ?fluid=${args.fluid}
    .gap=${args.gap}
    .padding=${args.padding}
  >
    <div slot="header" style="background: #e5e7eb; padding: 1rem;">
      Header Content
    </div>
    ${args.variant === "dashboard" || args.variant === "docs"
      ? html`
          <div slot="sidebar" style="background: #f3f4f6; padding: 1rem;">
            Sidebar Content
          </div>
        `
      : ""}
    <div style="background: #f9fafb; padding: 1rem; min-height: 400px;">
      Main Content
    </div>
    <div slot="footer" style="background: #e5e7eb; padding: 1rem;">
      Footer Content
    </div>
  </ui-layout>
`;

export const Default = Template.bind({});
Default.args = {
  variant: "default",
  fluid: false,
  gap: "medium",
  padding: "medium",
};

export const Dashboard = Template.bind({});
Dashboard.args = {
  variant: "dashboard",
  fluid: true,
  gap: "medium",
  padding: "none",
};

export const Landing = Template.bind({});
Landing.args = {
  variant: "landing",
  fluid: true,
  gap: "none",
  padding: "none",
};

export const Documentation = Template.bind({});
Documentation.args = {
  variant: "docs",
  fluid: false,
  gap: "medium",
  padding: "medium",
};

// Grid System Stories
const GridTemplate = (args) => html`
  <ui-grid
    .columns=${args.columns}
    .gap=${args.gap}
    .breakpoints=${args.breakpoints}
  >
    ${Array(args.items)
      .fill(0)
      .map(
        (_, i) => html`
          <div style="background: #e5e7eb; padding: 1rem; text-align: center;">
            Item ${i + 1}
          </div>
        `
      )}
  </ui-grid>
`;

export const Grid = GridTemplate.bind({});
Grid.args = {
  columns: 3,
  gap: "medium",
  items: 6,
  breakpoints: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
};

// Container Stories
const ContainerTemplate = (args) => html`
  <ui-container .size=${args.size} .padding=${args.padding}>
    <div style="background: #f3f4f6; padding: 2rem; text-align: center;">
      Container Content
    </div>
  </ui-container>
`;

export const Container = ContainerTemplate.bind({});
Container.args = {
  size: "medium",
  padding: "medium",
};
