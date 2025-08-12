import {   html   } from 'lit';
import "./select.js";

export default {
  title: "Atoms/Select",
  component: "neo-select",
  tags: ["autodocs"],
  argTypes: {
    options: { control: "object" },
    value: { control: "text" },
    label: { control: "text" },
    placeholder: { control: "text" },
    helper: { control: "text" },
    error: { control: "text" },
    multiple: { control: "boolean" },
    searchable: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    onChange: { action: "changed" },
  },
};

// Base template for all stories
const Template = (args) => {
  return html`
    <neo-select
      .options=${args.options}
      .value=${args.value}
      .label=${args.label}
      .placeholder=${args.placeholder}
      .helper=${args.helper}
      .error=${args.error}
      ?multiple=${args.multiple}
      ?searchable=${args.searchable}
      ?disabled=${args.disabled}
      ?required=${args.required}
      @change=${args.onChange}
    ></neo-select>
  `;
};

// Default select
export const Default = Template.bind({});
Default.args = {
  options: [
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
    { label: "Option 3", value: "option3" },
  ],
  value: "",
  label: "Select an option",
  placeholder: "Choose from the list",
  helper: "",
  error: "",
  multiple: false,
  searchable: false,
  disabled: false,
  required: false,
};

// Select with preselected value
export const WithSelectedValue = Template.bind({});
WithSelectedValue.args = {
  ...Default.args,
  value: "option2",
};

// Multiple select
export const MultipleSelect = Template.bind({});
MultipleSelect.args = {
  ...Default.args,
  value: ["option1", "option3"],
  multiple: true,
};

// Searchable select
export const SearchableSelect = Template.bind({});
SearchableSelect.args = {
  ...Default.args,
  options: [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Cherry", value: "cherry" },
    { label: "Date", value: "date" },
    { label: "Elderberry", value: "elderberry" },
    { label: "Fig", value: "fig" },
    { label: "Grape", value: "grape" },
    { label: "Honeydew", value: "honeydew" },
  ],
  searchable: true,
  label: "Search for a fruit",
};

// Disabled select
export const DisabledSelect = Template.bind({});
DisabledSelect.args = {
  ...Default.args,
  disabled: true,
};

// Select with error
export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  error: "Please select a valid option",
};

// Select with helper text
export const WithHelperText = Template.bind({});
WithHelperText.args = {
  ...Default.args,
  helper: "Choose the option that best fits your needs",
};

// Select with option groups
export const WithOptionGroups = Template.bind({});
WithOptionGroups.args = {
  options: [
    {
      label: "Fruits",
      options: [
        { label: "Apple", value: "apple" },
        { label: "Banana", value: "banana" },
        { label: "Cherry", value: "cherry" },
      ],
    },
    {
      label: "Vegetables",
      options: [
        { label: "Carrot", value: "carrot" },
        { label: "Broccoli", value: "broccoli" },
        { label: "Spinach", value: "spinach" },
      ],
    },
  ],
  value: "",
  label: "Select a food item",
  placeholder: "Choose a fruit or vegetable",
  multiple: false,
  searchable: true,
  disabled: false,
  required: false,
};
