import {   html   } from 'lit';
import "./dropdown.js";

export default {
  title: "Atoms/Dropdown",
  component: "neo-dropdown",
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    items: { control: "object" },
    value: { control: "text" },
    onChange: { action: "changed" },
  },
};

// Base template for all stories
const Template = (args) => {
  return html`
    <neo-dropdown
      .label=${args.label}
      .items=${args.items}
      .value=${args.value}
      @change=${args.onChange}
    ></neo-dropdown>
  `;
};

// Default dropdown
export const Default = Template.bind({});
Default.args = {
  label: "Select an option",
  items: [
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
    { label: "Option 3", value: "option3" },
  ],
  value: "",
};

// Dropdown with preselected value
export const WithSelectedValue = Template.bind({});
WithSelectedValue.args = {
  label: "Select an option",
  items: [
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
    { label: "Option 3", value: "option3" },
  ],
  value: "option2",
};

// Dropdown with icons
export const WithIcons = Template.bind({});
WithIcons.args = {
  label: "Select an option",
  items: [
    { label: "Home", value: "home", icon: "home" },
    { label: "Settings", value: "settings", icon: "settings" },
    { label: "Profile", value: "profile", icon: "person" },
  ],
  value: "",
};

// Dropdown with many options
export const WithManyOptions = Template.bind({});
WithManyOptions.args = {
  label: "Select a country",
  items: [
    { label: "United States", value: "us" },
    { label: "Canada", value: "ca" },
    { label: "United Kingdom", value: "uk" },
    { label: "Australia", value: "au" },
    { label: "Germany", value: "de" },
    { label: "France", value: "fr" },
    { label: "Japan", value: "jp" },
    { label: "China", value: "cn" },
    { label: "Brazil", value: "br" },
    { label: "India", value: "in" },
  ],
  value: "",
};
