import "./docs-page.js";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Documentation",
  component: "docs-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<docs-page></docs-page>`,
};
