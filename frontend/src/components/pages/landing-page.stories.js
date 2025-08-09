import "../components/header.js";
import "../components/footer.js";
import "./landing-page.js";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Pages/Landing",
  component: "landing-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`
    <app-header></app-header>
    <landing-page></landing-page>
    <app-footer></app-footer>
  `,
};
