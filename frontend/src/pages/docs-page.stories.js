import "./docs-page.js";
import { html } from "lit";

export default {
  title: "Pages/Documentation",
  component: "docs-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<docs-page></docs-page>`,
};
