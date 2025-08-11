import "./rich-text-editor.js";
// html import removed - not used

export default {
  title: "Components/Rich Text Editor",
  component: "rich-text-editor",
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    onChange: { action: "changed" },
  },
};

export const Default = {
  args: {
    value: "<p>Hello, <strong>world</strong>!</p>",
    placeholder: "Type your content...",
    disabled: false,
  },
};

export const Disabled = {
  args: {
    value: "<p>This editor is disabled.</p>",
    disabled: true,
  },
};
