import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./radio.js";

export default {
  title: "UI/Radio",
  component: "ui-radio",
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
    label: { control: "text" },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-radio
    .name=${args.name}
    .value=${args.value}
    .checked=${args.checked}
    .disabled=${args.disabled}
    .required=${args.required}
    @change=${(e) => console.log("Radio changed:", e.detail)}
    >${args.label}</ui-radio
  >
`;

const GroupTemplate = (args) => html`
  <div class="radio-group" role="radiogroup" aria-label=${args.groupLabel}>
    ${args.options.map(
      (option) => html`
        <ui-radio
          .name=${args.name}
          .value=${option.value}
          .checked=${option.value === args.selected}
          .disabled=${option.disabled}
          @change=${(e) => console.log("Radio changed:", e.detail)}
          >${option.label}</ui-radio
        >
      `
    )}
  </div>
`;

export const Default = Template.bind({});
Default.args = {
  name: "option",
  value: "value1",
  label: "Radio Option",
  checked: false,
  disabled: false,
  required: false,
};

export const Checked = Template.bind({});
Checked.args = {
  name: "option",
  value: "value1",
  label: "Checked Option",
  checked: true,
  disabled: false,
  required: false,
};

export const Disabled = Template.bind({});
Disabled.args = {
  name: "option",
  value: "value1",
  label: "Disabled Option",
  checked: false,
  disabled: true,
  required: false,
};

export const Required = Template.bind({});
Required.args = {
  name: "option",
  value: "value1",
  label: "Required Option",
  checked: false,
  disabled: false,
  required: true,
};

export const RadioGroup = GroupTemplate.bind({});
RadioGroup.args = {
  name: "preferences",
  groupLabel: "Select your preference",
  selected: "light",
  options: [
    { value: "light", label: "Light Theme" },
    { value: "dark", label: "Dark Theme" },
    { value: "system", label: "System Theme", disabled: true },
  ],
};
