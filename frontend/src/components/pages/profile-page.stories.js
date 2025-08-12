import "./profile-page.js";
import {   html   } from 'lit';

export default {
  title: "Pages/Profile",
  component: "profile-page",
  tags: ["autodocs"],
};

export const Default = {
  render: () => html`<profile-page></profile-page>`,
};
