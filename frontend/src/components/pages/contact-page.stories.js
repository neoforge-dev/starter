import "./contact-page.js";
import {   html   } from 'lit';

export default {
  title: "Pages/Contact",
  component: "contact-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<contact-page></contact-page>`,
};
