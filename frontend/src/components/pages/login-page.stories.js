import "./login-page.js";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Login",
  component: "login-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<login-page></login-page>`,
};
