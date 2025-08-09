import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./rating.js";

export default {
  title: "Form/Rating",
  component: "ui-rating",
  argTypes: {
    value: { control: "number" },
    max: { control: "number" },
    size: { control: "select", options: ["small", "medium", "large"] },
    variant: {
      control: "select",
      options: ["star", "heart", "circle", "custom"],
    },
    precision: { control: "select", options: [0.5, 1] },
    readonly: { control: "boolean" },
    disabled: { control: "boolean" },
    showValue: { control: "boolean" },
    label: { control: "text" },
    customIcons: { control: "object" },
  },
};

const Template = (args) => html`
  <ui-rating
    .value=${args.value}
    .max=${args.max}
    .size=${args.size}
    .variant=${args.variant}
    .precision=${args.precision}
    ?readonly=${args.readonly}
    ?disabled=${args.disabled}
    ?showValue=${args.showValue}
    .label=${args.label}
    .customIcons=${args.customIcons}
    @change=${(e) => console.log("Rating changed:", e.detail)}
    @hover=${(e) => console.log("Rating hover:", e.detail)}
  ></ui-rating>
`;

export const Star = Template.bind({});
Star.args = {
  value: 3.5,
  max: 5,
  size: "medium",
  variant: "star",
  precision: 0.5,
  readonly: false,
  disabled: false,
  showValue: true,
  label: "Rate this item",
};

export const Heart = Template.bind({});
Heart.args = {
  value: 4,
  max: 5,
  size: "medium",
  variant: "heart",
  precision: 1,
  readonly: false,
  disabled: false,
  showValue: true,
  label: "How much did you like it?",
};

export const Circle = Template.bind({});
Circle.args = {
  value: 7,
  max: 10,
  size: "small",
  variant: "circle",
  precision: 1,
  readonly: false,
  disabled: false,
  showValue: true,
  label: "Score",
};

export const Custom = Template.bind({});
Custom.args = {
  value: 3,
  max: 5,
  size: "large",
  variant: "custom",
  precision: 1,
  readonly: false,
  disabled: false,
  showValue: true,
  label: "Difficulty level",
  customIcons: {
    empty: "🌑",
    half: "🌓",
    filled: "🌕",
  },
};

export const Readonly = Template.bind({});
Readonly.args = {
  value: 4.5,
  max: 5,
  size: "medium",
  variant: "star",
  precision: 0.5,
  readonly: true,
  disabled: false,
  showValue: true,
  label: "Average rating",
};

export const Disabled = Template.bind({});
Disabled.args = {
  value: 3,
  max: 5,
  size: "medium",
  variant: "star",
  precision: 1,
  readonly: false,
  disabled: true,
  showValue: true,
  label: "Rating disabled",
};

export const NoLabel = Template.bind({});
NoLabel.args = {
  value: 4,
  max: 5,
  size: "medium",
  variant: "star",
  precision: 1,
  readonly: false,
  disabled: false,
  showValue: false,
};

export const LargeScale = Template.bind({});
LargeScale.args = {
  value: 8.5,
  max: 10,
  size: "small",
  variant: "star",
  precision: 0.5,
  readonly: false,
  disabled: false,
  showValue: true,
  label: "Rate on a scale of 1-10",
};
