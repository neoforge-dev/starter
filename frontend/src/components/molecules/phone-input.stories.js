import {  html  } from 'lit';
import "./phone-input.js";

export default {
  title: "UI/PhoneInput",
  component: "ui-phone-input",
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
    label: { control: "text" },
    placeholder: { control: "text" },
    defaultCountry: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    error: { control: "text" },
  },
};

const Template = (args) => html`
  <ui-phone-input
    .name=${args.name}
    .value=${args.value}
    .label=${args.label}
    .placeholder=${args.placeholder}
    .defaultCountry=${args.defaultCountry}
    .disabled=${args.disabled}
    .required=${args.required}
    .error=${args.error}
    @change=${(e) => console.log("Phone changed:", e.detail)}
    @validate=${(e) => console.log("Validation:", e.detail)}
  ></ui-phone-input>
`;

export const Default = Template.bind({});
Default.args = {
  name: "phone",
  label: "Phone Number",
  placeholder: "Enter phone number",
  defaultCountry: "US",
  disabled: false,
  required: false,
};

export const WithValue = Template.bind({});
WithValue.args = {
  name: "phone",
  value: "+1234567890",
  label: "Phone Number",
  placeholder: "Enter phone number",
  defaultCountry: "US",
  disabled: false,
  required: false,
};

export const Required = Template.bind({});
Required.args = {
  name: "phone",
  label: "Phone Number (Required)",
  placeholder: "Enter phone number",
  defaultCountry: "US",
  disabled: false,
  required: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  name: "phone",
  value: "+1234567890",
  label: "Phone Number",
  placeholder: "Enter phone number",
  defaultCountry: "US",
  disabled: true,
  required: false,
};

export const WithError = Template.bind({});
WithError.args = {
  name: "phone",
  value: "+123",
  label: "Phone Number",
  placeholder: "Enter phone number",
  defaultCountry: "US",
  disabled: false,
  required: true,
  error: "Please enter a valid phone number",
};

export const DifferentCountry = Template.bind({});
DifferentCountry.args = {
  name: "phone",
  label: "Phone Number",
  placeholder: "Enter phone number",
  defaultCountry: "GB",
  disabled: false,
  required: false,
};
