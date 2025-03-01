import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./alert.js";

export default {
  title: "Molecules/Alert",
  component: "neo-alert",
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "error"],
      description: "Visual style of the alert",
    },
    title: {
      control: "text",
      description: "Alert title",
    },
    dismissible: {
      control: "boolean",
      description: "Whether the alert can be dismissed",
    },
    icon: {
      control: "boolean",
      description: "Whether to show the variant icon",
    },
    elevated: {
      control: "boolean",
      description: "Whether to show elevation shadow",
    },
  },
};

const Template = (args) => html`
  <neo-alert
    variant=${args.variant || "info"}
    title=${args.title || ""}
    ?dismissible=${args.dismissible}
    ?icon=${args.icon}
    ?elevated=${args.elevated}
    @neo-dismiss=${() => console.log("Alert dismissed")}
  >
    ${args.content || "Alert content"}
  </neo-alert>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {
  content: "This is a default info alert.",
};

export const WithTitle = Template.bind({});
WithTitle.args = {
  title: "Alert Title",
  content: "This is an alert with a title.",
};

// Variants
export const Info = Template.bind({});
Info.args = {
  variant: "info",
  title: "Information",
  content: "This is an informational alert.",
};

export const Success = Template.bind({});
Success.args = {
  variant: "success",
  title: "Success",
  content: "Operation completed successfully.",
};

export const Warning = Template.bind({});
Warning.args = {
  variant: "warning",
  title: "Warning",
  content: "Please review your input before proceeding.",
};

export const Error = Template.bind({});
Error.args = {
  variant: "error",
  title: "Error",
  content: "An error occurred while processing your request.",
};

// Features
export const Dismissible = Template.bind({});
Dismissible.args = {
  title: "Dismissible Alert",
  content: "Click the X button to dismiss this alert.",
  dismissible: true,
};

export const NoIcon = Template.bind({});
NoIcon.args = {
  title: "No Icon",
  content: "This alert doesn't show an icon.",
  icon: false,
};

export const Elevated = Template.bind({});
Elevated.args = {
  title: "Elevated Alert",
  content: "This alert has a shadow elevation.",
  elevated: true,
};

// Use cases
export const FormValidation = () => html`
  <div style="max-width: 400px;">
    <neo-alert variant="error" title="Form Validation Error" elevated>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Username is required</li>
        <li>Password must be at least 8 characters</li>
        <li>Email address is invalid</li>
      </ul>
    </neo-alert>
  </div>
`;

export const SuccessMessage = () => html`
  <div style="max-width: 400px;">
    <neo-alert variant="success" title="Profile Updated" dismissible elevated>
      <p style="margin: 0;">
        Your profile has been successfully updated.
        <a href="#" style="color: inherit;">View profile</a>
      </p>
    </neo-alert>
  </div>
`;

export const SystemStatus = () => html`
  <div
    style="max-width: 400px; display: flex; flex-direction: column; gap: 16px;"
  >
    <neo-alert variant="success">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="material-icons" style="font-size: 16px;">cloud_done</span>
        API Server: Operational
      </div>
    </neo-alert>
    <neo-alert variant="warning">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="material-icons" style="font-size: 16px;">warning</span>
        Database: High Load
      </div>
    </neo-alert>
    <neo-alert variant="error">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="material-icons" style="font-size: 16px;">error</span>
        CDN: Service Disruption
      </div>
    </neo-alert>
  </div>
`;

export const MaintenanceNotice = () => html`
  <neo-alert
    variant="warning"
    title="Scheduled Maintenance"
    dismissible
    elevated
  >
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <p style="margin: 0;">
        The system will be undergoing maintenance on Saturday, July 15th, from
        2:00 AM to 4:00 AM UTC.
      </p>
      <div style="display: flex; gap: 16px;">
        <button>Learn More</button>
        <button>Set Reminder</button>
      </div>
    </div>
  </neo-alert>
`;
