import {  html  } from 'lit';
import "./tabs.js";

export default {
  title: "UI/Tabs",
  component: "ui-tabs",
  argTypes: {
    tabs: { control: "object" },
    activeTab: { control: "text" },
    variant: { control: "select", options: ["default", "pills", "underline"] },
  },
};

const Template = (args) => html`
  <ui-tabs
    .tabs=${args.tabs}
    .activeTab=${args.activeTab}
    .variant=${args.variant}
    @tab-change=${(e) => console.log("Tab changed:", e.detail)}
  ></ui-tabs>
`;

export const Default = Template.bind({});
Default.args = {
  tabs: [
    { id: "tab1", label: "Overview", content: "Overview content" },
    { id: "tab2", label: "Features", content: "Features content" },
    { id: "tab3", label: "Pricing", content: "Pricing content" },
  ],
  activeTab: "tab1",
  variant: "default",
};

export const Pills = Template.bind({});
Pills.args = {
  tabs: [
    { id: "settings1", label: "Account", content: "Account settings" },
    { id: "settings2", label: "Profile", content: "Profile settings" },
    { id: "settings3", label: "Security", content: "Security settings" },
  ],
  activeTab: "settings1",
  variant: "pills",
};

export const Underline = Template.bind({});
Underline.args = {
  tabs: [
    { id: "docs1", label: "Installation", content: "Installation guide" },
    { id: "docs2", label: "API", content: "API documentation" },
    { id: "docs3", label: "Examples", content: "Code examples" },
  ],
  activeTab: "docs1",
  variant: "underline",
};

export const WithIcons = Template.bind({});
WithIcons.args = {
  tabs: [
    { id: "home", label: "🏠 Home", content: "Home content" },
    { id: "search", label: "🔍 Search", content: "Search content" },
    { id: "settings", label: "⚙️ Settings", content: "Settings content" },
  ],
  activeTab: "home",
  variant: "default",
};
