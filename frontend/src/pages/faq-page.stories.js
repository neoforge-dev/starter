import "./faq-page.js";
import { html } from "lit";

export default {
  title: "Pages/FAQ",
  component: "faq-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<faq-page></faq-page>`,
};
