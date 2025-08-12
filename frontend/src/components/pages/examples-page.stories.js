import "./examples-page.js";
import {   html   } from 'lit';

export default {
  title: "Pages/Examples",
  component: "examples-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<examples-page></examples-page>`,
};
