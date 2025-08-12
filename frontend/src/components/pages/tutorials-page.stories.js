import "./tutorials-page.js";
import {   html   } from 'lit';

export default {
  title: "Pages/Tutorials",
  component: "tutorials-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<tutorials-page></tutorials-page>`,
};
