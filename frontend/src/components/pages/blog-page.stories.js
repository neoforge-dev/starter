import { html } from "lit";
import "./blog-page.js"; // Import the component

// NOTE: This page component currently renders hardcoded blog posts.
// In a real app, this data would come from an API.
// The default story reflects the current hardcoded state.

export default {
  title: "Pages/Blog Page",
  component: "blog-page",
  parameters: {
    layout: "fullscreen",
  },
};

// Template function
const Template = () => html`<blog-page></blog-page>`;

// Default story
export const Default = Template.bind({});
Default.args = {
  // blog-page currently has no external args/properties
};
