export default {
  title: "Components/Button",
  component: "neo-button",
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "outline", "text"],
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
    onClick: { action: "clicked" },
  },
};

export const Primary = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

export const Secondary = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

export const Loading = {
  args: {
    children: "Loading Button",
    loading: true,
  },
};

export const Disabled = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const Small = {
  args: {
    children: "Small Button",
    size: "small",
  },
};

export const Large = {
  args: {
    children: "Large Button",
    size: "large",
  },
};

export const FullWidth = {
  args: {
    children: "Full Width Button",
    fullWidth: true,
  },
};

export const WithIcon = {
  args: {
    children: "Button with Icon",
    icon: "add",
  },
};
