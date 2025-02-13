import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./select.js";

export default {
  title: "UI/Select",
  component: "ui-select",
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
    label: { control: "text" },
    placeholder: { control: "text" },
    options: { control: "object" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    multiple: { control: "boolean" },
    searchable: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-select
    .name=${args.name}
    .value=${args.value}
    .label=${args.label}
    .placeholder=${args.placeholder}
    .options=${args.options}
    .disabled=${args.disabled}
    .required=${args.required}
    .multiple=${args.multiple}
    .searchable=${args.searchable}
    @change=${(e) => console.log("Select changed:", e.detail)}
  ></ui-select>
`;

export const Default = Template.bind({});
Default.args = {
  name: "country",
  label: "Select Country",
  placeholder: "Choose a country...",
  options: [
    { value: "us", label: "🇺🇸 United States" },
    { value: "uk", label: "🇬🇧 United Kingdom" },
    { value: "ca", label: "🇨🇦 Canada" },
    { value: "au", label: "🇦🇺 Australia" },
  ],
  disabled: false,
  required: false,
  multiple: false,
  searchable: false,
};

export const WithSearch = Template.bind({});
WithSearch.args = {
  name: "language",
  label: "Programming Language",
  placeholder: "Search languages...",
  options: [
    { value: "js", label: "JavaScript" },
    { value: "py", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "rb", label: "Ruby" },
    { value: "go", label: "Go" },
  ],
  disabled: false,
  required: false,
  multiple: false,
  searchable: true,
};

export const Multiple = Template.bind({});
Multiple.args = {
  name: "skills",
  label: "Select Skills",
  placeholder: "Choose skills...",
  options: [
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "js", label: "JavaScript" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
  ],
  value: ["html", "css"],
  disabled: false,
  required: false,
  multiple: true,
  searchable: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  name: "disabled",
  label: "Disabled Select",
  placeholder: "Cannot select...",
  options: [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ],
  disabled: true,
  required: false,
  multiple: false,
  searchable: false,
};

export const Required = Template.bind({});
Required.args = {
  name: "required",
  label: "Required Field",
  placeholder: "Must select...",
  options: [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ],
  disabled: false,
  required: true,
  multiple: false,
  searchable: false,
};

export const WithGroups = Template.bind({});
WithGroups.args = {
  name: "framework",
  label: "Select Framework",
  placeholder: "Choose framework...",
  options: [
    {
      label: "Frontend",
      options: [
        { value: "react", label: "React" },
        { value: "vue", label: "Vue" },
        { value: "angular", label: "Angular" },
      ],
    },
    {
      label: "Backend",
      options: [
        { value: "express", label: "Express" },
        { value: "django", label: "Django" },
        { value: "rails", label: "Ruby on Rails" },
      ],
    },
  ],
  disabled: false,
  required: false,
  multiple: false,
  searchable: true,
};
