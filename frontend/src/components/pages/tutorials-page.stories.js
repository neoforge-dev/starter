import "./tutorials-page.js";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Tutorials",
  component: "tutorials-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<tutorials-page></tutorials-page>`,
};
