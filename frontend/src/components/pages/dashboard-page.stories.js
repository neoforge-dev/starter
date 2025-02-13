import "./dashboard-page.js";
import { html } from "lit";

export default {
  title: "Pages/Dashboard",
  component: "dashboard-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<dashboard-page></dashboard-page>`,
};
