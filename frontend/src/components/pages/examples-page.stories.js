import "./examples-page.js";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Examples",
  component: "examples-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<examples-page></examples-page>`,
};
