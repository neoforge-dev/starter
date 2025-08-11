// Example story file - no imports needed for this basic example

export default {
  title: "Example/Button",
  argTypes: {
    backgroundColor: { control: "color" },
    label: { control: "text" },
    onClick: { action: "onClick" },
  },
};

// Use a function that returns a string instead of a template literal
const Template = (args) => {
  return `<button
    style="background-color: ${args.backgroundColor}"
    @click=${args.onClick}
  >
    ${args.label}
  </button>`;
};

export const Primary = Template.bind({});
Primary.args = {
  backgroundColor: "#ff0000",
  label: "Button",
};

export const Secondary = Template.bind({});
Secondary.args = {
  backgroundColor: "#00ff00",
  label: "Button",
};

export const Large = Template.bind({});
Large.args = {
  backgroundColor: "#0000ff",
  label: "Button",
  size: "large",
};
