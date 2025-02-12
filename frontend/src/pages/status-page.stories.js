import "./status-page.js";
import { html } from "lit";

export default {
  title: "Pages/Status",
  component: "status-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<status-page></status-page>`,
};
