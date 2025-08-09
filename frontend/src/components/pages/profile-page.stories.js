import "./profile-page.js";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Profile",
  component: "profile-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<profile-page></profile-page>`,
};
