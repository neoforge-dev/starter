import {   html   } from 'lit';
import { useState } from "@storybook/preview-api";
import "./modal.js"; // Assuming modal component is defined here
import "../../atoms/button/button.js";
// Import the modal service
import { modalService } from "../../../services/modal-service.js";

export default {
  title: "Molecules/Modal",
  component: "neo-modal",
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls the visibility of the modal",
    },
    title: {
      control: "text",
      description: "The title displayed in the modal header",
    },
    hideCloseButton: {
      control: "boolean",
      description: "Hides the default close button in the header",
    },
    // Default slot for modal body content
    content: {
      control: "text",
      description: "Main content for the modal body (default slot)",
      table: { category: "Slots" },
    },
    // Example of controlling a potential footer slot via args (if applicable)
    // footerContent: {
    //   control: 'text',
    //   description: 'Content for the named 'footer' slot',
    //   table: { category: 'Slots' },
    // },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A dialog component for displaying content in a layer above the main page. Can be used directly or programmatically via the `modalService`.",
      },
      // Source code displayed in Storybook Docs
      source: {
        code: `
<neo-button @click=\${() => document.getElementById('myModal').openModal()}>Open Modal</neo-button>

<neo-modal id="myModal" title="My Modal Title">
  <p>Modal content goes here.</p>
  <neo-button slot="footer" @click=\${() => document.getElementById('myModal').closeModal()}>Close</neo-button>
</neo-modal>
        `,
      },
    },
  },
};

// Template showing basic modal usage with external button control
const DirectUsageTemplate = ({ title, hideCloseButton, content }) => {
  // Use Storybook's useState hook for managing open state
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return html`
    <neo-button @click=${openModal}>Open Modal</neo-button>

    <neo-modal
      title=${title || "Default Modal Title"}
      ?hide-close-button=${hideCloseButton}
      .open=${isOpen}
      @neo-close=${closeModal}
    >
      ${content || "This is the default modal content."}

      <div
        slot="footer"
        style="display: flex; justify-content: flex-end; gap: 8px;"
      >
        <neo-button @click=${closeModal}>Close</neo-button>
        <neo-button variant="primary" @click=${closeModal}
          >Save Changes</neo-button
        >
      </div>
    </neo-modal>
  `;
};

export const Default = DirectUsageTemplate.bind({});
Default.args = {
  title: "Standard Modal",
  content:
    "This is the body content of the modal. You can put text, forms, or other components here.",
};
Default.storyName = "Direct Usage: Default"; // Rename for clarity

export const NoCloseButton = DirectUsageTemplate.bind({});
NoCloseButton.args = {
  title: "Modal Without Close Button",
  hideCloseButton: true,
  content:
    "The default header close button is hidden. Use footer actions to close.",
};
NoCloseButton.storyName = "Direct Usage: No Close Button";

export const LongContentStory = DirectUsageTemplate.bind({}); // Renamed to avoid conflict
LongContentStory.args = {
  title: "Modal With Long Content",
  content: html`
    <p>This modal demonstrates how longer content is handled.</p>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </p>
    <p>
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
      dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
      proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p>
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
      doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
      inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
    </p>
    <p>
      Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
      fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem
      sequi nesciunt.
    </p>
  `, // Content includes multiple paragraphs
};
LongContentStory.storyName = "Direct Usage: Long Content";

// Example showing how to manually control the modal without Storybook args
export const ManualControl = () => html`
  <neo-button @click=${() => document.getElementById('manualModal').open = true}>Open
    Manually</neo-button>

  <neo-modal id="manualModal" title="Manually Controlled">
    <p>
      This modal's visibility is controlled by setting its 'open' property
      directly.
    </p>
    <div slot="footer" style="text-align: right;">
      <neo-button @click=${() => document.getElementById('manualModal').open = false}>Close</neo-button>
    </div>
  </neo-modal>
`;
ManualControl.parameters = {
  controls: { hideNoControlsWarning: true },
};
ManualControl.storyName = "Direct Usage: Manual Control";

// --- Service Usage Examples ---

export const ServiceConfirmation = () => {
  const [result, setResult] = useState(null);

  const showConfirm = async () => {
    setResult("..."); // Indicate waiting
    const confirmed = await modalService.confirm({
      title: "Confirm Action",
      message: "Are you sure you want to proceed with this action?",
      confirmText: "Proceed",
      cancelText: "Cancel",
      modalOptions: { size: "sm" }, // Pass options to the underlying neo-modal
    });
    setResult(confirmed ? "Confirmed!" : "Cancelled.");
  };

  return html`
    <neo-button @click=${showConfirm}>Show Confirmation</neo-button>
    <p style="margin-top: 1rem; font-size: 0.9rem; color: grey;">
      Result: ${result !== null ? result : "(Click button)"}
    </p>
  `;
};
ServiceConfirmation.storyName = "Service Usage: Confirmation";

export const ServiceBasic = () => {
  const showBasic = () => {
    modalService.show({
      options: { title: "Service Modal" },
      content: html`<p style="padding: 1rem;">
        This modal was opened via <code>modalService.show()</code>.
      </p>`,
      footer: html`<neo-button slot="footer" @click=${(e) => e.target.closest('neo-modal')?.close()}>Close</neo-button>`,
    });
  };
  return html`<neo-button @click=${showBasic}
    >Show Basic Service Modal</neo-button
  >`;
};
ServiceBasic.storyName = "Service Usage: Basic Show";

export const ServiceSizes = () => {
  const showSized = (size) => {
    modalService.show({
      options: { title: `${size.toUpperCase()} Modal`, size: size },
      content: html`<div style="padding: 1rem;">
        <p>This is a ${size} modal shown via the service.</p>
      </div>`,
      footer: html`<neo-button slot="footer" @click=${(e) => e.target.closest('neo-modal')?.close()}>Close</neo-button>`,
    });
  };
  return html`
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      ${["sm", "md", "lg", "xl", "full"].map(
        (size) => html`
          <neo-button @click=${() => showSized(size)}>${size.toUpperCase()}</neo-button>
        `
      )}
    </div>
  `;
};
ServiceSizes.storyName = "Service Usage: Sizes";

// Note: The original 'Positions' and 'Animations' stories relied on properties
// that were part of the organism modal implementation and are not present
// in the molecule modal or the refactored service. They are omitted here.
// If slide-in/out effects are desired, they should be added to the molecule component itself.

export const ServiceForm = () => {
  const showForm = () => {
    let modalInstance;
    modalService
      .show({
        options: {
          title: "Edit Profile (Service)",
          size: "md",
          closeOnEscape: false, // Prevent closing form easily
          closeOnOverlay: false,
        },
        content: html`
          <form id="profileFormService" style="padding: 1rem;">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem;">Name</label>
              <input
                type="text"
                value="Jane Doe Service"
                style="width: 100%;"
              />
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem;"
                >Email</label
              >
              <input
                type="email"
                value="jane.service@example.com"
                style="width: 100%;"
              />
            </div>
            <!-- Add more form fields as needed -->
          </form>
        `,
        footer: html`
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <neo-button variant="secondary" @click=${async () => {
              const confirmed = await modalService.confirm({
                title: "Discard Changes?",
                message: "Are you sure you want to discard changes?",
                confirmText: "Discard",
                size: "sm"
              });
              if (confirmed) modalInstance?.close();
            }}>Cancel</neo-button>
            <neo-button variant="primary" @click=${() => {
              console.log("Saving form data...");
              modalInstance?.close();
            }}>Save Changes</neo-button>
          </div>
        `,
      })
      .then((instance) => {
        modalInstance = instance; // Store the instance to close it later
      });
  };

  return html`<neo-button @click=${showForm}
    >Show Form via Service</neo-button
  >`;
};
ServiceForm.storyName = "Service Usage: Form";

// Nested example needs careful handling with the new service promise resolution
export const ServiceNested = () => {
  const openFirst = () => {
    modalService
      .show({
        options: { title: "First Modal (Service)", size: "md" },
        content: html`
          <div style="padding: 1rem;">
            <p>This is the first modal opened via the service.</p>
            <neo-button id="openSecondService">Open Second Modal</neo-button>
          </div>
        `,
        footer: html`<neo-button slot="footer" @click="\${(e)" ="">
          e.target.closest('neo-modal')?.close()}>Close First</neo-button
        >`,
      })
      .then((firstModalInstance) => {
        // Need to find the button within the modal content to attach listener
        const openSecondButton =
          firstModalInstance.querySelector("#openSecondService");
        if (openSecondButton) {
          openSecondButton.onclick = () => {
            modalService.show({
              options: { title: "Second Modal (Service)", size: "sm" },
              content: html`<p style="padding: 1rem;">
                This is the second modal.
              </p>`,
              footer: html`<neo-button slot="footer" @click="\${(e)" ="">
                e.target.closest('neo-modal')?.close()}>Close Second</neo-button
              >`,
            });
          };
        } else {
          console.warn("Could not find button to open second modal.");
        }
      });
  };

  return html`<neo-button @click=${openFirst}
    >Open Nested Modals via Service</neo-button
  >`;
};
ServiceNested.storyName = "Service Usage: Nested";
