import {   html   } from 'lit';
import "./components-page.js"; // Import the page component

// Import all UI components used by the page
import "../ui/tabs.js";
import "../ui/card.js";
import "../ui/button.js";
import "../ui/input.js";
import "../ui/spinner.js";
import "../ui/dropdown.js";
import "../ui/badge.js";
import "../ui/breadcrumbs.js";
import "../ui/pagination.js";

export default {
  title: "Pages/Components Showcase Page",
  component: "components-page",
  parameters: {
    layout: "fullscreen",
  },
};

// Template function
const Template = () => html`<components-page></components-page>`;

// Default story
export const Default = Template.bind({});
Default.args = {
  // components-page currently has no external args/properties
};
