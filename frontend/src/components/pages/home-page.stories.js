import { html } from "lit";
import "./home-page.js"; // Import the component

// Import any sub-components if they are not auto-loaded or are dynamic
// (Based on home-page.js, it seems self-contained or uses globally registered components)

export default {
  title: "Pages/Home Page",
  component: "home-page",
  parameters: {
    layout: "fullscreen", // Home page typically needs full width
  },
};

// Template function
const Template = () => html`<home-page></home-page>`;

// Default story showing the full page
export const Default = Template.bind({});
Default.args = {
  // home-page doesn't seem to have external args/properties to control initially
};
