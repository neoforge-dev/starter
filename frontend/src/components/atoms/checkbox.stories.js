import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./checkbox.js";

export default {
  title: "UI/Checkbox",
  component: "ui-checkbox",
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
    label: { control: "text" },
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-checkbox
    .name=${args.name}
    .value=${args.value}
    .checked=${args.checked}
    .indeterminate=${args.indeterminate}
    .disabled=${args.disabled}
    .required=${args.required}
    @change=${(e) => console.log("Checkbox changed:", e.detail)}
    >${args.label}</ui-checkbox
  >
`;

const GroupTemplate = (args) => html`
  <div class="checkbox-group">
    <h3>${args.groupLabel}</h3>
    ${args.options.map(
      (option) => html`
        <ui-checkbox
          .name=${option.name}
          .value=${option.value}
          .checked=${option.checked}
          .disabled=${option.disabled}
          @change=${(e) => console.log("Checkbox changed:", e.detail)}
          >${option.label}</ui-checkbox
        >
      `
    )}
  </div>
`;

export const Default = Template.bind({});
Default.args = {
  name: "agreement",
  value: "accepted",
  label: "I agree to the terms",
  checked: false,
  indeterminate: false,
  disabled: false,
  required: false,
};

export const Checked = Template.bind({});
Checked.args = {
  name: "agreement",
  value: "accepted",
  label: "Checked Option",
  checked: true,
  indeterminate: false,
  disabled: false,
  required: false,
};

export const Indeterminate = Template.bind({});
Indeterminate.args = {
  name: "selectAll",
  value: "all",
  label: "Select All Items",
  checked: false,
  indeterminate: true,
  disabled: false,
  required: false,
};

export const Disabled = Template.bind({});
Disabled.args = {
  name: "agreement",
  value: "accepted",
  label: "Disabled Option",
  checked: false,
  indeterminate: false,
  disabled: true,
  required: false,
};

export const Required = Template.bind({});
Required.args = {
  name: "agreement",
  value: "accepted",
  label: "Required Option",
  checked: false,
  indeterminate: false,
  disabled: false,
  required: true,
};

export const CheckboxGroup = GroupTemplate.bind({});
CheckboxGroup.args = {
  groupLabel: "Select your interests",
  options: [
    { name: "interests", value: "tech", label: "Technology", checked: true },
    { name: "interests", value: "science", label: "Science", checked: false },
    {
      name: "interests",
      value: "art",
      label: "Art",
      checked: false,
      disabled: true,
    },
  ],
};
