import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./modal.js";

export default {
  title: "Molecules/Modal",
  component: "neo-modal",
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
      description: "Size of the modal",
    },
    closeOnOverlay: {
      control: "boolean",
      description: "Whether to close when clicking the overlay",
    },
    closeOnEscape: {
      control: "boolean",
      description: "Whether to close when pressing Escape",
    },
    preventScroll: {
      control: "boolean",
      description: "Whether to prevent body scrolling when open",
    },
  },
};

const Template = (args) => html`
  <div>
    <neo-modal
      ?open=${args.open}
      size=${args.size || "md"}
      ?closeOnOverlay=${args.closeOnOverlay}
      ?closeOnEscape=${args.closeOnEscape}
      ?preventScroll=${args.preventScroll}
      @neo-close=${() => console.log("Modal closed")}
    >
      ${args.content || "Modal content"}
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      Open Modal
    </button>
  </div>
`;

// Basic examples
export const Default = Template.bind({});
Default.args = {
  content: "This is a default modal with standard configuration.",
};

export const Small = Template.bind({});
Small.args = {
  size: "sm",
  content: "A small modal for simple content.",
};

export const Large = Template.bind({});
Large.args = {
  size: "lg",
  content: "A large modal for more complex content.",
};

export const FullScreen = Template.bind({});
FullScreen.args = {
  size: "full",
  content: "A full-screen modal for immersive experiences.",
};

// Features
export const CustomHeader = () => html`
  <div>
    <neo-modal size="md">
      <div slot="header" style="padding: 8px;">
        <h3 style="margin: 0;">Custom Header</h3>
        <p style="margin: 4px 0 0 0; color: var(--color-text-secondary);">
          With additional description
        </p>
      </div>
      <p>Modal content with a custom header.</p>
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      Open Modal
    </button>
  </div>
`;

export const CustomFooter = () => html`
  <div>
    <neo-modal size="md">
      <p>Modal content with custom footer actions.</p>
      <div slot="footer">
        <button
          @click=${(e) => {
            const modal = e.target.closest("neo-modal");
            modal.close();
          }}
        >
          Cancel
        </button>
        <button style="margin-left: 8px;">Save Changes</button>
      </div>
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      Open Modal
    </button>
  </div>
`;

// Use cases
export const ConfirmDialog = () => html`
  <div>
    <neo-modal size="sm">
      <span slot="title">Confirm Action</span>
      <p style="margin: 0;">Are you sure you want to delete this item?</p>
      <div slot="footer">
        <button
          @click=${(e) => {
            const modal = e.target.closest("neo-modal");
            modal.close();
          }}
        >
          Cancel
        </button>
        <button style="margin-left: 8px; background-color: var(--color-error);">
          Delete
        </button>
      </div>
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      Delete Item
    </button>
  </div>
`;

export const FormModal = () => html`
  <div>
    <neo-modal size="md">
      <span slot="title">Edit Profile</span>
      <form style="display: grid; gap: 16px;">
        <div>
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            value="John Doe"
            style="width: 100%; margin-top: 4px;"
          />
        </div>
        <div>
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            value="john@example.com"
            style="width: 100%; margin-top: 4px;"
          />
        </div>
        <div>
          <label for="bio">Bio</label>
          <textarea id="bio" rows="3" style="width: 100%; margin-top: 4px;">
Software engineer passionate about web development.</textarea
          >
        </div>
      </form>
      <div slot="footer">
        <button
          @click=${(e) => {
            const modal = e.target.closest("neo-modal");
            modal.close();
          }}
        >
          Cancel
        </button>
        <button style="margin-left: 8px;">Save Changes</button>
      </div>
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      Edit Profile
    </button>
  </div>
`;

export const ImagePreview = () => html`
  <div>
    <neo-modal size="lg">
      <div slot="header" style="padding: 8px;">
        <h3 style="margin: 0;">Image Preview</h3>
      </div>
      <div style="text-align: center;">
        <img
          src="https://picsum.photos/800/600"
          alt="Random"
          style="max-width: 100%; height: auto;"
        />
      </div>
      <div slot="footer">
        <button>Download</button>
        <button style="margin-left: 8px;">Share</button>
      </div>
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      View Image
    </button>
  </div>
`;

export const NestedModals = () => html`
  <div>
    <neo-modal size="md">
      <span slot="title">First Modal</span>
      <p>This is the first modal. Click the button to open a nested modal.</p>
      <button
        @click=${(e) => {
          const secondModal = e.target.nextElementSibling;
          secondModal.open = true;
        }}
      >
        Open Second Modal
      </button>
      <neo-modal size="sm">
        <span slot="title">Second Modal</span>
        <p>This is a nested modal!</p>
        <div slot="footer">
          <button
            @click=${(e) => {
              const modal = e.target.closest("neo-modal");
              modal.close();
            }}
          >
            Close
          </button>
        </div>
      </neo-modal>
    </neo-modal>
    <button
      @click=${(e) => {
        const modal = e.target.nextElementSibling;
        modal.open = true;
      }}
    >
      Open First Modal
    </button>
  </div>
`;
