import "./dashboard-page.js";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Dashboard",
  component: "dashboard-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<dashboard-page></dashboard-page>`,
};
