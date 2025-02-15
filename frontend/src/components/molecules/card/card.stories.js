import { html } from "lit";
import "./card.js";

export default {
  title: "Molecules/Card",
  component: "neo-card",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outlined", "elevated"],
      description: "Visual style of the card",
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "Padding size",
    },
    hoverable: {
      control: "boolean",
      description: "Whether to show hover effects",
    },
    clickable: {
      control: "boolean",
      description: "Whether the card is clickable",
    },
    href: {
      control: "text",
      description: "URL for clickable cards",
    },
  },
};

const Template = (args) => html`
  <div style="width: 300px;">
    <neo-card
      variant=${args.variant || "default"}
      padding=${args.padding || "md"}
      ?hoverable=${args.hoverable}
      ?clickable=${args.clickable}
      href=${args.href || ""}
    >
      ${args.content || "Card content"}
    </neo-card>
  </div>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {
  content: "A simple card with default styling",
};

export const Outlined = Template.bind({});
Outlined.args = {
  variant: "outlined",
  content: "An outlined card",
};

export const Elevated = Template.bind({});
Elevated.args = {
  variant: "elevated",
  content: "An elevated card with stronger shadow",
};

// Interactive states
export const Hoverable = Template.bind({});
Hoverable.args = {
  hoverable: true,
  content: "Hover over me to see the effect",
};

export const Clickable = Template.bind({});
Clickable.args = {
  clickable: true,
  href: "#",
  content: "Click me - I'm a link!",
};

// Padding variations
export const NoPadding = Template.bind({});
NoPadding.args = {
  padding: "none",
  content: "A card without padding",
};

export const LargePadding = Template.bind({});
LargePadding.args = {
  padding: "lg",
  content: "A card with large padding",
};

// Use cases
export const MediaCard = () => html`
  <div style="width: 300px;">
    <neo-card padding="none" hoverable>
      <img
        slot="media"
        src="https://picsum.photos/300/200"
        alt="Random image"
      />
      <div style="padding: 16px;">
        <h3 style="margin: 0 0 8px 0;">Card Title</h3>
        <p style="margin: 0; color: var(--color-text-secondary);">
          A card with a media element and some content.
        </p>
      </div>
    </neo-card>
  </div>
`;

export const HeaderFooterCard = () => html`
  <div style="width: 300px;">
    <neo-card>
      <div slot="header">
        <h3 style="margin: 0;">Card Header</h3>
      </div>
      <p style="margin: 0;">
        This is the main content area of the card. It can contain any content
        you want.
      </p>
      <div
        slot="footer"
        style="display: flex; justify-content: flex-end; gap: 8px;"
      >
        <button>Cancel</button>
        <button>Save</button>
      </div>
    </neo-card>
  </div>
`;

export const ProfileCard = () => html`
  <div style="width: 300px;">
    <neo-card variant="elevated" hoverable>
      <div style="text-align: center;">
        <img
          src="https://picsum.photos/100/100"
          alt="Profile"
          style="border-radius: 50%; margin-bottom: 16px;"
        />
        <h3 style="margin: 0 0 8px 0;">John Doe</h3>
        <p style="margin: 0 0 16px 0; color: var(--color-text-secondary);">
          Software Engineer
        </p>
        <div style="display: flex; justify-content: center; gap: 8px;">
          <button>Follow</button>
          <button>Message</button>
        </div>
      </div>
    </neo-card>
  </div>
`;

export const StatisticsCard = () => html`
  <div style="width: 300px;">
    <neo-card variant="outlined">
      <div slot="header">
        <h3 style="margin: 0;">Statistics</h3>
      </div>
      <div
        style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;"
      >
        <div>
          <div style="font-size: 24px; font-weight: bold;">2,451</div>
          <div style="color: var(--color-text-secondary);">Views</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">89</div>
          <div style="color: var(--color-text-secondary);">Comments</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">129</div>
          <div style="color: var(--color-text-secondary);">Shares</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">$2.1k</div>
          <div style="color: var(--color-text-secondary);">Revenue</div>
        </div>
      </div>
    </neo-card>
  </div>
`;

export const CardGrid = () => html`
  <div
    style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      padding: 16px;
    "
  >
    <neo-card hoverable>
      <h3 style="margin: 0 0 8px 0;">Card 1</h3>
      <p style="margin: 0;">Some content for card 1.</p>
    </neo-card>
    <neo-card hoverable>
      <h3 style="margin: 0 0 8px 0;">Card 2</h3>
      <p style="margin: 0;">Some content for card 2.</p>
    </neo-card>
    <neo-card hoverable>
      <h3 style="margin: 0 0 8px 0;">Card 3</h3>
      <p style="margin: 0;">Some content for card 3.</p>
    </neo-card>
  </div>
`;
