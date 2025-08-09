import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { ToastService } from "../../../services/toast-service.js"; // Adjust path as needed
import "./toast.js"; // Assuming toast component is defined here
import "../../atoms/button/button.js";

export default {
  title: "Molecules/Toast",
  component: "neo-toast", // The underlying component tag
  argTypes: {
    // Args for triggering toast via ToastService
    message: {
      control: "text",
      description: "Content/message of the toast",
      table: { category: "Toast Trigger" },
    },
    type: {
      control: { type: "select" },
      options: ["info", "success", "warning", "error"],
      description: "Type of the toast (info, success, warning, error)",
      table: { category: "Toast Trigger" },
    },
    duration: {
      control: { type: "number", min: 0 },
      description: "Duration in ms (0 = persistent until closed)",
      table: { category: "Toast Trigger" },
    },
    // Args for the neo-toast element itself (less common to set directly)
    toastId: {
      control: "text",
      description: "(Internal) ID of the toast message",
      table: { category: "neo-toast Props" },
    },
    toastType: {
      control: "text",
      description: "(Internal) Type of the toast message",
      table: { category: "neo-toast Props" },
    },
    toastMessage: {
      control: "text",
      description: "(Internal) Message content of the toast",
      table: { category: "neo-toast Props" },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Displays brief, temporary notifications (toasts). Usually triggered via the ToastService rather than direct element usage.",
      },
      source: {
        code: `
// Import the service
import { ToastService } from './path/to/toast-service.js';

// Trigger a toast
ToastService.show({ message: 'Item saved!', type: 'success', duration: 3000 });
        `,
      },
    },
    // Add a container for toasts to appear in Storybook
    layout: "centered",
  },
  // Add a decorator to ensure the toast container exists
  decorators: [
    (Story) => html`
      <div
        id="toast-container"
        style="position: fixed; top: 1rem; right: 1rem; z-index: 1000;"
      ></div>
      ${Story()}
    `,
  ],
};

// Template focused on triggering toasts via the service
const Template = ({ message, type, duration }) => {
  const showToast = () => {
    ToastService.show({ message, type, duration });
  };

  return html`
    <neo-button @click=${showToast}>Show Toast</neo-button>
    <p style="margin-top: 1rem; font-size: 0.8rem; color: grey;">
      (Click button to trigger toast with current args)
    </p>
  `;
};

export const Default = Template.bind({});
Default.args = {
  message: "This is an informational toast.",
  type: "info",
  duration: 3000,
};

export const Success = Template.bind({});
Success.args = {
  message: "Action completed successfully!",
  type: "success",
  duration: 3000,
};

export const Warning = Template.bind({});
Warning.args = {
  message: "Warning: Please check details.",
  type: "warning",
  duration: 5000,
};

export const Error = Template.bind({});
Error.args = {
  message: "An error occurred.",
  type: "error",
  duration: 0, // Persistent until manually closed
};

export const PersistentInfo = Template.bind({});
PersistentInfo.args = {
  message: "This toast stays until closed.",
  type: "info",
  duration: 0,
};

// Example showing multiple toasts
export const MultipleToasts = () => {
  const showMultiple = () => {
    ToastService.show({ message: "First toast (success)", type: "success" });
    setTimeout(() => {
      ToastService.show({
        message: "Second toast (error, persistent)",
        type: "error",
        duration: 0,
      });
    }, 500);
    setTimeout(() => {
      ToastService.show({ message: "Third toast (info)", type: "info" });
    }, 1000);
  };

  return html`
    <neo-button @click=${showMultiple}>Show Multiple Toasts</neo-button>
  `;
};
MultipleToasts.parameters = {
  controls: { hideNoControlsWarning: true },
};
