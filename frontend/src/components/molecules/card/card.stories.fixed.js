import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./card.js";

export default {
  title: "Molecules/Card",
  component: "neo-card",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "elevated", "outlined", "filled"],
      description: "The variant style of the card",
    },
    clickable: {
      control: "boolean",
      description: "Whether the card is clickable",
    },
    padding: {
      control: "select",
      options: ["none", "small", "medium", "large"],
      description: "The padding size of the card",
    },
    onClick: { action: "clicked" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A versatile card component for displaying content in a contained format.",
      },
    },
  },
};

// Use a function that returns a string instead of a template literal
const Template = (args) => {
  return `
    <neo-card
      variant="${args.variant || "default"}"
      ${args.clickable ? "clickable" : ""}
      padding="${args.padding || "medium"}"
    >
      <div slot="header">
        <h3 style="margin: 0;">${args.title || "Card Title"}</h3>
        ${args.subtitle ? `<p style="margin: 0; color: #666;">${args.subtitle}</p>` : ""}
      </div>
      <div slot="content" style="padding: 16px;">
        ${args.content || "This is the card content. You can put any content here."}
      </div>
      ${
        args.footer
          ? `
        <div slot="footer" style="padding: 16px; border-top: 1px solid #eee;">
          ${args.footer}
        </div>
      `
          : ""
      }
    </neo-card>
  `;
};

// Basic Variants
export const Default = Template.bind({});
Default.args = {
  title: "Default Card",
  content: "This is a default card with medium padding.",
};

export const Elevated = Template.bind({});
Elevated.args = {
  title: "Elevated Card",
  variant: "elevated",
  content: "This card has a shadow to make it appear elevated.",
};

export const Outlined = Template.bind({});
Outlined.args = {
  title: "Outlined Card",
  variant: "outlined",
  content: "This card has a border outline instead of a shadow.",
};

export const Filled = Template.bind({});
Filled.args = {
  title: "Filled Card",
  variant: "filled",
  content: "This card has a background color fill.",
};

// With Subtitle
export const WithSubtitle = Template.bind({});
WithSubtitle.args = {
  title: "Card with Subtitle",
  subtitle: "Supporting information",
  content: "This card includes a subtitle below the main title.",
};

// With Footer
export const WithFooter = Template.bind({});
WithFooter.args = {
  title: "Card with Footer",
  content: "This card includes a footer section at the bottom.",
  footer: "<button>Action</button>",
};

// Clickable Card
export const Clickable = Template.bind({});
Clickable.args = {
  title: "Clickable Card",
  clickable: true,
  content: "This card is clickable and can be used as a navigation element.",
};

// Different Padding Sizes
export const NoPadding = Template.bind({});
NoPadding.args = {
  title: "No Padding",
  padding: "none",
  content: "This card has no padding around its content.",
};

export const LargePadding = Template.bind({});
LargePadding.args = {
  title: "Large Padding",
  padding: "large",
  content: "This card has large padding around its content.",
};

// Card Group Example
export const CardGroup = () => {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
      <neo-card variant="default">
        <div slot="header">
          <h3 style="margin: 0;">Card 1</h3>
        </div>
        <div slot="content" style="padding: 16px;">
          Content for card 1
        </div>
      </neo-card>
      <neo-card variant="elevated">
        <div slot="header">
          <h3 style="margin: 0;">Card 2</h3>
        </div>
        <div slot="content" style="padding: 16px;">
          Content for card 2
        </div>
      </neo-card>
      <neo-card variant="outlined">
        <div slot="header">
          <h3 style="margin: 0;">Card 3</h3>
        </div>
        <div slot="content" style="padding: 16px;">
          Content for card 3
        </div>
      </neo-card>
    </div>
  `;
};
