import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./breadcrumbs.js";

export default {
  title: "UI/Breadcrumbs",
  component: "ui-breadcrumbs",
  argTypes: {
    items: { control: "object" },
    separator: { control: "text" },
  },
};

const Template = (args) => html`
  <ui-breadcrumbs
    .items=${args.items}
    .separator=${args.separator}
  ></ui-breadcrumbs>
`;

export const Default = Template.bind({});
Default.args = {
  items: [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Categories", href: "/products/categories" },
  ],
  separator: "/",
};

export const CustomSeparator = Template.bind({});
CustomSeparator.args = {
  items: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/dashboard/settings" },
    { label: "Profile", href: "/dashboard/settings/profile" },
  ],
  separator: ">",
};

export const SingleItem = Template.bind({});
SingleItem.args = {
  items: [{ label: "Home", href: "/" }],
  separator: "/",
};
