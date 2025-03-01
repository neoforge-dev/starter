import "./contact-page.js";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Contact",
  component: "contact-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<contact-page></contact-page>`,
};
