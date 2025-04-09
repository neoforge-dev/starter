import { html } from "lit";
import "./not-found-page.js"; // Import the component

// Import sub-components used
import "../ui/button.js";

// Mock the router service if its methods are called directly in event handlers
// For basic rendering, mocking might not be strictly needed, but good practice
// if interactions are part of the story.

export default {
  title: "Pages/Not Found Page",
  component: "not-found-page",
  parameters: {
    layout: "centered",
  },
};

// Template function
const Template = () => html`<not-found-page></not-found-page>`;

// Default story
export const Default = Template.bind({});
Default.args = {
  // not-found-page currently has no args/properties
};
