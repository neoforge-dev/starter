import {   html   } from 'lit';
import "./tooltip.js";

export default {
  title: "Atoms/Tooltip",
  component: "neo-tooltip",
  tags: ["autodocs"],
  argTypes: {
    content: { control: "text" },
    position: {
      control: { type: "select" },
      options: ["top", "right", "bottom", "left"],
    },
    variant: {
      control: { type: "select" },
      options: ["dark", "light"],
    },
    arrow: { control: "boolean" },
    delay: { control: "number" },
  },
};

// Base template for all stories
const Template = (args) => {
  return html`
    <div style="padding: 100px; display: flex; justify-content: center;">
      <neo-tooltip
        .content=${args.content}
        .position=${args.position}
        .variant=${args.variant}
        .arrow=${args.arrow}
        .delay=${args.delay}
      >
        <button>Hover me</button>
      </neo-tooltip>
    </div>
  `;
};

// Default tooltip
export const Default = Template.bind({});
Default.args = {
  content: "This is a tooltip",
  position: "top",
  variant: "dark",
  arrow: true,
  delay: 200,
};

// Tooltip positions
export const TopPosition = Template.bind({});
TopPosition.args = {
  content: "Tooltip on top",
  position: "top",
  variant: "dark",
  arrow: true,
  delay: 200,
};

export const RightPosition = Template.bind({});
RightPosition.args = {
  content: "Tooltip on right",
  position: "right",
  variant: "dark",
  arrow: true,
  delay: 200,
};

export const BottomPosition = Template.bind({});
BottomPosition.args = {
  content: "Tooltip on bottom",
  position: "bottom",
  variant: "dark",
  arrow: true,
  delay: 200,
};

export const LeftPosition = Template.bind({});
LeftPosition.args = {
  content: "Tooltip on left",
  position: "left",
  variant: "dark",
  arrow: true,
  delay: 200,
};

// Tooltip variants
export const LightVariant = Template.bind({});
LightVariant.args = {
  content: "Light tooltip",
  position: "top",
  variant: "light",
  arrow: true,
  delay: 200,
};

// Tooltip without arrow
export const NoArrow = Template.bind({});
NoArrow.args = {
  content: "Tooltip without arrow",
  position: "top",
  variant: "dark",
  arrow: false,
  delay: 200,
};

// Tooltip with long content
export const LongContent = Template.bind({});
LongContent.args = {
  content:
    "This is a tooltip with very long content that might wrap to multiple lines depending on the width",
  position: "top",
  variant: "dark",
  arrow: true,
  delay: 200,
};
