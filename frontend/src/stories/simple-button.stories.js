export default {
  title: "Example/SimpleButton",
  argTypes: {
    backgroundColor: { control: "color" },
    label: { control: "text" },
    onClick: { action: "onClick" },
  },
};

// Use a function that returns a string instead of a template literal
const Template = (args) => {
  return `<button
    style="background-color: ${args.backgroundColor}; 
           padding: 10px 20px;
           border-radius: 4px;
           border: none;
           cursor: pointer;
           font-size: 16px;
           color: white;"
    onclick="console.log('Button clicked')"
  >
    ${args.label}
  </button>`;
};

export const Primary = Template.bind({});
Primary.args = {
  backgroundColor: "#ff0000",
  label: "Primary Button",
};

export const Secondary = Template.bind({});
Secondary.args = {
  backgroundColor: "#00ff00",
  label: "Secondary Button",
};

export const Large = Template.bind({});
Large.args = {
  backgroundColor: "#0000ff",
  label: "Large Button",
  size: "large",
};
