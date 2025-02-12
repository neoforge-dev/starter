import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./pagination.js";

export default {
  title: "UI/Pagination",
  component: "ui-pagination",
  argTypes: {
    currentPage: { control: "number" },
    totalPages: { control: "number" },
    maxVisiblePages: { control: "number" },
  },
};

const Template = (args) => html`
  <ui-pagination
    .currentPage=${args.currentPage}
    .totalPages=${args.totalPages}
    .maxVisiblePages=${args.maxVisiblePages}
    @page-change=${(e) => console.log("Page changed:", e.detail)}
  ></ui-pagination>
`;

export const Default = Template.bind({});
Default.args = {
  currentPage: 1,
  totalPages: 10,
  maxVisiblePages: 5,
};

export const ManyPages = Template.bind({});
ManyPages.args = {
  currentPage: 5,
  totalPages: 100,
  maxVisiblePages: 7,
};

export const FewPages = Template.bind({});
FewPages.args = {
  currentPage: 2,
  totalPages: 3,
  maxVisiblePages: 3,
};

export const SinglePage = Template.bind({});
SinglePage.args = {
  currentPage: 1,
  totalPages: 1,
  maxVisiblePages: 5,
};
