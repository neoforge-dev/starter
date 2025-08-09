import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./spinner.js";

export default {
  title: "UI/Spinner",
  component: "ui-spinner",
  argTypes: {
    size: { control: "select", options: ["small", "medium", "large"] },
    color: { control: "color" },
    variant: { control: "select", options: ["circle", "dots", "pulse"] },
  },
};

const Template = (args) => html`
  <ui-spinner
    .size=${args.size}
    .color=${args.color}
    .variant=${args.variant}
  ></ui-spinner>
`;

export const Default = Template.bind({});
Default.args = {
  size: "medium",
  color: "#0066cc",
  variant: "circle",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
  color: "#0066cc",
  variant: "circle",
};

export const Large = Template.bind({});
Large.args = {
  size: "large",
  color: "#0066cc",
  variant: "circle",
};

export const Dots = Template.bind({});
Dots.args = {
  size: "medium",
  color: "#0066cc",
  variant: "dots",
};

export const Pulse = Template.bind({});
Pulse.args = {
  size: "medium",
  color: "#0066cc",
  variant: "pulse",
};
