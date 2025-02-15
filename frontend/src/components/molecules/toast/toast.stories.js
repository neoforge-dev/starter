import { html } from "lit";
import "./toast.js";

export default {
  title: "Molecules/Toast",
  component: "neo-toast",
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "error"],
      description: "Visual style of the toast",
    },
    position: {
      control: "select",
      options: ["top-left", "top-right", "bottom-left", "bottom-right"],
      description: "Position on screen",
    },
    message: {
      control: "text",
      description: "Toast message",
    },
    duration: {
      control: "number",
      description: "Duration in milliseconds before auto-dismiss",
    },
    dismissible: {
      control: "boolean",
      description: "Whether the toast can be dismissed manually",
    },
    icon: {
      control: "boolean",
      description: "Whether to show the variant icon",
    },
  },
};

const Template = (args) => html`
  <div>
    <neo-toast
      variant=${args.variant || "info"}
      position=${args.position || "top-right"}
      message=${args.message || "Toast message"}
      duration=${args.duration || 5000}
      ?dismissible=${args.dismissible}
      ?icon=${args.icon}
      @neo-dismiss=${() => console.log("Toast dismissed")}
    ></neo-toast>
    <button
      @click=${(e) => {
        const toast = e.target.previousElementSibling;
        toast._visible = true;
      }}
    >
      Show Toast
    </button>
  </div>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {
  message: "This is a default info toast.",
};

// Variants
export const Info = Template.bind({});
Info.args = {
  variant: "info",
  message: "This is an informational message.",
};

export const Success = Template.bind({});
Success.args = {
  variant: "success",
  message: "Operation completed successfully!",
};

export const Warning = Template.bind({});
Warning.args = {
  variant: "warning",
  message: "Please review your changes before proceeding.",
};

export const Error = Template.bind({});
Error.args = {
  variant: "error",
  message: "An error occurred while saving changes.",
};

// Positions
export const TopLeft = Template.bind({});
TopLeft.args = {
  position: "top-left",
  message: "Toast in top-left position",
};

export const TopRight = Template.bind({});
TopRight.args = {
  position: "top-right",
  message: "Toast in top-right position",
};

export const BottomLeft = Template.bind({});
BottomLeft.args = {
  position: "bottom-left",
  message: "Toast in bottom-left position",
};

export const BottomRight = Template.bind({});
BottomRight.args = {
  position: "bottom-right",
  message: "Toast in bottom-right position",
};

// Features
export const NonDismissible = Template.bind({});
NonDismissible.args = {
  dismissible: false,
  message: "This toast cannot be dismissed manually.",
};

export const NoIcon = Template.bind({});
NoIcon.args = {
  icon: false,
  message: "This toast doesn't show an icon.",
};

export const LongDuration = Template.bind({});
LongDuration.args = {
  duration: 10000,
  message: "This toast will stay visible for 10 seconds.",
};

export const NoDuration = Template.bind({});
NoDuration.args = {
  duration: 0,
  message: "This toast will not auto-dismiss.",
};

// Use cases
export const SaveSuccess = () => html`
  <div>
    <neo-toast
      variant="success"
      message="Changes saved successfully!"
      duration="3000"
    ></neo-toast>
    <button
      @click=${(e) => {
        const toast = e.target.previousElementSibling;
        toast._visible = true;
      }}
    >
      Save Changes
    </button>
  </div>
`;

export const ValidationError = () => html`
  <div>
    <neo-toast
      variant="error"
      message="Please fill in all required fields."
      position="bottom-right"
    ></neo-toast>
    <button
      @click=${(e) => {
        const toast = e.target.previousElementSibling;
        toast._visible = true;
      }}
    >
      Submit Form
    </button>
  </div>
`;

export const NetworkStatus = () => html`
  <div style="display: flex; gap: 8px;">
    <neo-toast
      variant="warning"
      message="You are currently offline. Changes will be saved locally."
      position="top-left"
      duration="0"
    ></neo-toast>
    <button
      @click=${(e) => {
        const toast = e.target.previousElementSibling;
        toast._visible = true;
      }}
    >
      Go Offline
    </button>
    <button
      @click=${(e) => {
        const toast = e.target.previousElementSibling.previousElementSibling;
        toast.close();
      }}
    >
      Go Online
    </button>
  </div>
`;

export const MultipleToasts = () => html`
  <div style="display: flex; gap: 8px;">
    <neo-toast
      variant="info"
      message="Downloading file..."
      position="bottom-right"
      duration="0"
    ></neo-toast>
    <neo-toast
      variant="success"
      message="File downloaded successfully!"
      position="bottom-right"
      duration="3000"
    ></neo-toast>
    <button
      @click=${(e) => {
        const downloadToast =
          e.target.previousElementSibling.previousElementSibling;
        downloadToast._visible = true;
        setTimeout(() => {
          downloadToast.close();
          const successToast = e.target.previousElementSibling;
          successToast._visible = true;
        }, 2000);
      }}
    >
      Download File
    </button>
  </div>
`;
