import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./community-page.js"; // Import the component

// NOTE: This page component currently renders hardcoded static content.

export default {
  title: "Pages/Community Page",
  component: "community-page",
  parameters: {
    layout: "fullscreen",
  },
};

// Template function
const Template = () => html`<community-page></community-page>`;

// Default story
export const Default = Template.bind({});
Default.args = {
  // community-page currently has no external args/properties
};
