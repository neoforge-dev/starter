import "./faq-page.js";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/FAQ",
  component: "faq-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<faq-page></faq-page>`,
};
