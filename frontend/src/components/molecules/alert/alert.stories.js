import {   html   } from 'lit';
import "./alert.js"; // Assuming alert component is defined here

// Import icon stories if needed for examples, or define necessary icons
// import '../../atoms/icon/icon.js';

export default {
  title: "Molecules/Alert",
  component: "neo-alert",
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["info", "success", "warning", "error"],
      description: "Type of the alert (info, success, warning, error)",
    },
    closable: {
      control: "boolean",
      description: "Whether the alert can be closed",
    },
    icon: {
      control: "text",
      description: "Optional icon name to display",
    },
    // Default slot for alert content
    content: {
      control: "text",
      description: "Alert message content (default slot)",
    },
  },
  parameters: {
    docs: {
      description: {
        component: "A component to display contextual feedback messages.",
      },
    },
  },
};

const Template = ({ type, closable, icon, content }) => html`
  <neo-alert type=${type} ?closable=${closable} icon=${icon || ""}>
    ${content}
  </neo-alert>
`;

export const Info = Template.bind({});
Info.args = {
  type: "info",
  closable: false,
  icon: "info-circle",
  content: "This is an informational alert.",
};

export const Success = Template.bind({});
Success.args = {
  type: "success",
  closable: true,
  icon: "check-circle",
  content: "Operation completed successfully!",
};

export const Warning = Template.bind({});
Warning.args = {
  type: "warning",
  closable: true,
  icon: "exclamation-triangle",
  content: "Warning: Please check your input.",
};

export const Error = Template.bind({});
Error.args = {
  type: "error",
  closable: true,
  icon: "x-circle",
  content: "An error occurred while processing your request.",
};

export const InfoNotClosable = Template.bind({});
InfoNotClosable.args = {
  type: "info",
  closable: false,
  content: "This informational alert cannot be closed.",
};

export const WithoutIcon = Template.bind({});
WithoutIcon.args = {
  type: "success",
  closable: true,
  content: "This success alert does not have an icon.",
};

export const CustomContent = Template.bind({});
CustomContent.args = {
  type: "info",
  closable: true,
  icon: "info-circle",
  content: html`
    This alert has <strong>custom HTML</strong> content with a
    <a href="#" @click=${(e) => e.preventDefault()}>link</a>.
  `,
};
