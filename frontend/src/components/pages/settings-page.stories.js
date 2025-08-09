import "./settings-page.js";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Settings",
  component: "settings-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<settings-page></settings-page>`,
};
