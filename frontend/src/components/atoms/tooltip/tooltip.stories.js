import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./tooltip.js";

export default {
  title: "Atoms/Tooltip",
  component: "neo-tooltip",
  argTypes: {
    content: {
      control: "text",
      description: "Text content of the tooltip",
    },
    position: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Position of the tooltip",
    },
    variant: {
      control: "select",
      options: ["dark", "light"],
      description: "Visual style of the tooltip",
    },
    arrow: {
      control: "boolean",
      description: "Whether to show the arrow",
    },
    delay: {
      control: "number",
      description: "Delay before showing the tooltip (in ms)",
    },
  },
};

const Template = (args) => html`
  <div style="padding: 100px; text-align: center;">
    <neo-tooltip
      content=${args.content || "Tooltip content"}
      position=${args.position || "top"}
      variant=${args.variant || "dark"}
      ?arrow=${args.arrow ?? true}
      delay=${args.delay || 200}
    >
      <button>Hover me</button>
    </neo-tooltip>
  </div>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {
  content: "This is a tooltip",
};

// Positions
export const Top = Template.bind({});
Top.args = {
  content: "Top tooltip",
  position: "top",
};

export const Right = Template.bind({});
Right.args = {
  content: "Right tooltip",
  position: "right",
};

export const Bottom = Template.bind({});
Bottom.args = {
  content: "Bottom tooltip",
  position: "bottom",
};

export const Left = Template.bind({});
Left.args = {
  content: "Left tooltip",
  position: "left",
};

// Variants
export const Dark = Template.bind({});
Dark.args = {
  content: "Dark variant",
  variant: "dark",
};

export const Light = Template.bind({});
Light.args = {
  content: "Light variant",
  variant: "light",
};

// Features
export const NoArrow = Template.bind({});
NoArrow.args = {
  content: "Tooltip without arrow",
  arrow: false,
};

export const LongDelay = Template.bind({});
LongDelay.args = {
  content: "Delayed tooltip",
  delay: 1000,
};

// Use cases
export const IconTooltip = () => html`
  <div style="padding: 100px; text-align: center;">
    <neo-tooltip content="Help information">
      <span class="material-icons" style="cursor: help;">help_outline</span>
    </neo-tooltip>
  </div>
`;

export const LinkTooltip = () => html`
  <div style="padding: 100px; text-align: center;">
    <neo-tooltip content="Opens in a new window" position="bottom">
      <a href="#" target="_blank">External Link</a>
    </neo-tooltip>
  </div>
`;

export const FormFieldTooltip = () => html`
  <div style="padding: 100px; text-align: center;">
    <div
      style="display: flex; align-items: center; gap: 8px; justify-content: center;"
    >
      <label for="username">Username</label>
      <neo-tooltip
        content="Username must be at least 3 characters long"
        position="right"
        variant="light"
      >
        <span class="material-icons" style="font-size: 16px; color: #666;"
          >info</span
        >
      </neo-tooltip>
    </div>
    <input type="text" id="username" style="margin-top: 8px;" />
  </div>
`;

export const TooltipGrid = () => html`
  <div style="padding: 100px;">
    <div
      style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        max-width: 400px;
        margin: 0 auto;
      "
    >
      <neo-tooltip content="Top tooltip" position="top">
        <button>Top</button>
      </neo-tooltip>
      <neo-tooltip content="Right tooltip" position="right">
        <button>Right</button>
      </neo-tooltip>
      <neo-tooltip content="Bottom tooltip" position="bottom">
        <button>Bottom</button>
      </neo-tooltip>
      <neo-tooltip content="Left tooltip" position="left">
        <button>Left</button>
      </neo-tooltip>
    </div>
  </div>
`;
