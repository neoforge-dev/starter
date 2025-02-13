import { ModalDialog } from "./modal-dialog.js";

export default {
  title: "Components/Modal Dialog",
  component: "modal-dialog",
  tags: ["autodocs"],
  argTypes: {
    open: { control: "boolean" },
    onClose: { action: "closed" },
  },
};

export const Default = {
  args: {
    open: true,
  },
  render: (args) => html`
    <modal-dialog .open=${args.open} @modal-closed=${args.onClose}>
      <h2>Modal Title</h2>
      <p>This is a basic modal dialog with some content.</p>
      <neo-button @click=${args.onClose}>Close</neo-button>
    </modal-dialog>
  `,
};

export const WithForm = {
  args: {
    open: true,
  },
  render: (args) => html`
    <modal-dialog .open=${args.open} @modal-closed=${args.onClose}>
      <h2>Edit Profile</h2>
      <form @submit=${(e) => e.preventDefault()}>
        <neo-input label="Name" value="John Doe"></neo-input>
        <neo-input
          label="Email"
          type="email"
          value="john@example.com"
        ></neo-input>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <neo-button variant="secondary" @click=${args.onClose}
            >Cancel</neo-button
          >
          <neo-button variant="primary">Save Changes</neo-button>
        </div>
      </form>
    </modal-dialog>
  `,
};

export const WithLongContent = {
  args: {
    open: true,
  },
  render: (args) => html`
    <modal-dialog .open=${args.open} @modal-closed=${args.onClose}>
      <h2>Terms of Service</h2>
      ${Array(10)
        .fill()
        .map(
          () => html`
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          `
        )}
      <neo-button @click=${args.onClose}>Close</neo-button>
    </modal-dialog>
  `,
};

export const WithCustomWidth = {
  args: {
    open: true,
  },
  render: (args) => html`
    <style>
      modal-dialog {
        --modal-width: 800px;
      }
    </style>
    <modal-dialog .open=${args.open} @modal-closed=${args.onClose}>
      <h2>Wide Modal</h2>
      <p>This modal has a custom width of 800px.</p>
      <neo-button @click=${args.onClose}>Close</neo-button>
    </modal-dialog>
  `,
};
