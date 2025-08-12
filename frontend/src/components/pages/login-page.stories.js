import "./login-page.js";
import {   html   } from 'lit';

export default {
  title: "Pages/Login",
  component: "login-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<login-page></login-page>`,
};
