import { ToastNotification, showToast } from "./toast.js";

export default {
  title: "Components/Toast",
  component: "toast-notification",
  tags: ["autodocs"],
  argTypes: {
    message: { control: "text" },
    type: {
      control: { type: "select" },
      options: ["success", "error", "info", "warning"],
    },
    duration: { control: "number" },
  },
};

export const Success = {
  args: {
    message: "Operation completed successfully!",
    type: "success",
    duration: 3000,
  },
  render: (args) => {
    const handleClick = () => {
      showToast(args.message, args.type, args.duration);
    };

    return html`
      <neo-button @click=${handleClick}>Show Success Toast</neo-button>
    `;
  },
};

export const Error = {
  args: {
    message: "An error occurred. Please try again.",
    type: "error",
    duration: 3000,
  },
  render: (args) => {
    const handleClick = () => {
      showToast(args.message, args.type, args.duration);
    };

    return html`
      <neo-button @click=${handleClick}>Show Error Toast</neo-button>
    `;
  },
};

export const Info = {
  args: {
    message: "New updates are available.",
    type: "info",
    duration: 3000,
  },
  render: (args) => {
    const handleClick = () => {
      showToast(args.message, args.type, args.duration);
    };

    return html`
      <neo-button @click=${handleClick}>Show Info Toast</neo-button>
    `;
  },
};

export const Warning = {
  args: {
    message: "Your session will expire soon.",
    type: "warning",
    duration: 3000,
  },
  render: (args) => {
    const handleClick = () => {
      showToast(args.message, args.type, args.duration);
    };

    return html`
      <neo-button @click=${handleClick}>Show Warning Toast</neo-button>
    `;
  },
};

export const LongDuration = {
  args: {
    message: "This toast will stay visible for 10 seconds.",
    type: "info",
    duration: 10000,
  },
  render: (args) => {
    const handleClick = () => {
      showToast(args.message, args.type, args.duration);
    };

    return html`
      <neo-button @click=${handleClick}>Show Long Duration Toast</neo-button>
    `;
  },
};

export const MultipleToasts = {
  render: () => {
    const handleClick = () => {
      showToast("First toast", "success", 3000);
      setTimeout(() => {
        showToast("Second toast", "info", 3000);
      }, 1000);
      setTimeout(() => {
        showToast("Third toast", "warning", 3000);
      }, 2000);
    };

    return html`
      <neo-button @click=${handleClick}>Show Multiple Toasts</neo-button>
    `;
  },
};
