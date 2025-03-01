import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ifDefined } from "lit/directives/if-defined.js";
import "./select.js";

const basicOptions = [
  { value: "1", label: "Option 1" },
  { value: "2", label: "Option 2" },
  { value: "3", label: "Option 3" },
  { value: "4", label: "Option 4" },
  { value: "5", label: "Option 5" },
];

const groupedOptions = [
  {
    group: true,
    label: "Fruits",
    options: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "orange", label: "Orange" },
    ],
  },
  {
    group: true,
    label: "Vegetables",
    options: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
      { value: "spinach", label: "Spinach" },
    ],
  },
];

export default {
  title: "Atoms/Select",
  component: "neo-select",
  argTypes: {
    options: {
      control: "object",
      description: "Array of options or option groups",
    },
    value: {
      control: "text",
      description: "Selected value(s)",
    },
    label: {
      control: "text",
      description: "Label text for the select",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no option is selected",
    },
    helper: {
      control: "text",
      description: "Helper text displayed below the select",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    multiple: {
      control: "boolean",
      description: "Enable multiple selection",
    },
    searchable: {
      control: "boolean",
      description: "Enable search functionality",
    },
    disabled: {
      control: "boolean",
      description: "Disable the select",
    },
    required: {
      control: "boolean",
      description: "Mark the select as required",
    },
    "neo-change": {
      action: "neo-change",
      description: "Triggered when selection changes",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A customizable select component that supports single and multiple selection, option groups, search functionality, and keyboard navigation.",
      },
    },
  },
};

const Template = (args) => html`
  <neo-select
    .options="${args.options}"
    .value="${ifDefined(args.value)}"
    label="${ifDefined(args.label)}"
    placeholder="${ifDefined(args.placeholder)}"
    helper="${ifDefined(args.helper)}"
    error="${ifDefined(args.error)}"
    ?multiple="${args.multiple}"
    ?searchable="${args.searchable}"
    ?disabled="${args.disabled}"
    ?required="${args.required}"
    @neo-change="${args["neo-change"]}"
  ></neo-select>
`;

export const Default = Template.bind({});
Default.args = {
  options: basicOptions,
  label: "Basic Select",
  placeholder: "Choose an option",
};

export const WithValue = Template.bind({});
WithValue.args = {
  ...Default.args,
  value: "2",
};

export const WithHelper = Template.bind({});
WithHelper.args = {
  ...Default.args,
  helper: "Select one option from the list",
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  error: "Please select a valid option",
};

export const Required = Template.bind({});
Required.args = {
  ...Default.args,
  required: true,
  label: "Required Select",
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
  value: "1",
};

export const MultipleSelect = Template.bind({});
MultipleSelect.args = {
  ...Default.args,
  multiple: true,
  label: "Multiple Select",
  placeholder: "Choose one or more options",
  value: ["1", "3"],
};

export const SearchableSelect = Template.bind({});
SearchableSelect.args = {
  ...Default.args,
  searchable: true,
  label: "Searchable Select",
  placeholder: "Search and select an option",
};

export const GroupedOptions = Template.bind({});
GroupedOptions.args = {
  options: groupedOptions,
  label: "Food Categories",
  placeholder: "Select a food item",
};

export const SearchableGrouped = Template.bind({});
SearchableGrouped.args = {
  ...GroupedOptions.args,
  searchable: true,
  label: "Searchable Grouped Select",
};

export const MultipleSearchableGrouped = Template.bind({});
MultipleSearchableGrouped.args = {
  ...SearchableGrouped.args,
  multiple: true,
  label: "Multiple Searchable Grouped Select",
  value: ["apple", "carrot"],
};

// Form example with multiple selects
export const FormExample = () => html`
  <div style="max-width: 400px; padding: 20px;">
    <h3>Create Recipe</h3>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <neo-select
        .options="${groupedOptions}"
        label="Main Ingredient"
        required
        helper="Select the primary ingredient"
      ></neo-select>

      <neo-select
        .options="${groupedOptions}"
        label="Additional Ingredients"
        multiple
        searchable
        helper="Select additional ingredients (optional)"
      ></neo-select>
    </div>
  </div>
`;
