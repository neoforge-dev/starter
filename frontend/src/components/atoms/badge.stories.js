import {  html  } from 'lit';
import "./badge.js";

export default {
  title: "UI/Badge",
  component: "ui-badge",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "info"],
    },
    size: { control: "select", options: ["small", "medium", "large"] },
    text: { control: "text" },
    removable: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-badge
    .variant=${args.variant}
    .size=${args.size}
    .removable=${args.removable}
    @remove=${() => console.log("Badge removed")}
    >${args.text}</ui-badge
  >
`;

export const Default = Template.bind({});
Default.args = {
  variant: "default",
  size: "medium",
  text: "Default Badge",
  removable: false,
};

export const Success = Template.bind({});
Success.args = {
  variant: "success",
  size: "medium",
  text: "Success",
  removable: false,
};

export const Warning = Template.bind({});
Warning.args = {
  variant: "warning",
  size: "medium",
  text: "Warning",
  removable: true,
};

export const Error = Template.bind({});
Error.args = {
  variant: "error",
  size: "medium",
  text: "Error",
  removable: true,
};

export const Info = Template.bind({});
Info.args = {
  variant: "info",
  size: "medium",
  text: "Information",
  removable: false,
};

export const Small = Template.bind({});
Small.args = {
  variant: "default",
  size: "small",
  text: "Small Badge",
  removable: false,
};

export const Large = Template.bind({});
Large.args = {
  variant: "default",
  size: "large",
  text: "Large Badge",
  removable: true,
};
