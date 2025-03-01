import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./modal.js";
import "./button.js";
import { modalService } from "./modal.js";

export default {
  title: "Components/Modal",
  component: "neo-modal",
  parameters: {
    layout: "centered",
  },
};

// Basic modal
export const Basic = () => {
  const modal = document.createElement("neo-modal");
  modal.title = "Basic Modal";
  modal.innerHTML = `
    <div style="padding: 1rem;">
      <p>This is a basic modal with a title and close button.</p>
    </div>
  `;

  const button = document.createElement("button");
  button.textContent = "Open Modal";
  button.onclick = () => (modal.open = true);

  document.body.appendChild(modal);
  return button;
};

// Different sizes
export const Sizes = () => html`
  <div style="display: flex; gap: 1rem;">
    ${["sm", "md", "lg", "xl", "full"].map(
      (size) => html`
        <button
          @click=${() => {
            modalService.show({
              title: "${size.toUpperCase()} Modal",
              size,
              innerHTML: `
                <div style="padding: 1rem;">
                  <p>This is a ${size} modal.</p>
                </div>
              `,
            });
          }}
        >
          ${size.toUpperCase()}
        </button>
      `
    )}
  </div>
`;

// Different positions
export const Positions = () => html`
  <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
    ${["center", "top", "right", "bottom", "left"].map(
      (position) => html`
        <button
          @click=${() => {
            modalService.show({
              title: "${position} Modal",
              position,
              innerHTML: `
                <div style="padding: 1rem;">
                  <p>This modal slides in from the ${position}.</p>
                </div>
              `,
            });
          }}
        >
          ${position}
        </button>
      `
    )}
  </div>
`;

// Different animations
export const Animations = () => html`
  <div style="display: flex; gap: 1rem;">
    ${["fade", "slide", "scale"].map(
      (animation) => html`
        <button
          @click=${() => {
            modalService.show({
              title: "${animation} Animation",
              animation,
              innerHTML: `
                <div style="padding: 1rem;">
                  <p>This modal uses the ${animation} animation.</p>
                </div>
              `,
            });
          }}
        >
          ${animation}
        </button>
      `
    )}
  </div>
`;

// Nested modals
export const Nested = () => {
  const button = document.createElement("button");
  button.textContent = "Open First Modal";

  button.onclick = () => {
    modalService
      .show({
        title: "First Modal",
        size: "md",
        innerHTML: `
        <div style="padding: 1rem;">
          <p>This is the first modal.</p>
          <button id="openSecond">Open Second Modal</button>
        </div>
      `,
      })
      .then(() => {
        console.log("First modal closed");
      });

    // Wait for the modal to be added to the DOM
    setTimeout(() => {
      document.getElementById("openSecond").onclick = () => {
        modalService
          .show({
            title: "Second Modal",
            size: "sm",
            position: "top",
            innerHTML: `
            <div style="padding: 1rem;">
              <p>This is the second modal.</p>
            </div>
          `,
          })
          .then(() => {
            console.log("Second modal closed");
          });
      };
    }, 0);
  };

  return button;
};

// Confirmation dialog
export const Confirmation = () => {
  const button = document.createElement("button");
  button.textContent = "Show Confirmation";

  button.onclick = async () => {
    const confirmed = await modalService.confirm({
      title: "Delete Item",
      message:
        "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    console.log("User confirmed:", confirmed);
  };

  return button;
};

// Form modal
export const Form = () => {
  const button = document.createElement("button");
  button.textContent = "Open Form";

  button.onclick = () => {
    modalService
      .show({
        title: "Edit Profile",
        size: "md",
        persistent: true,
        innerHTML: `
        <form id="profileForm" style="padding: 1rem;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem;">Name</label>
            <input type="text" value="John Doe" style="width: 100%;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem;">Email</label>
            <input type="email" value="john@example.com" style="width: 100%;">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem;">Bio</label>
            <textarea rows="3" style="width: 100%;">Full-stack developer...</textarea>
          </div>
        </form>
      `,
        footerHTML: `
        <div slot="footer">
          <button id="cancelBtn">Cancel</button>
          <button id="saveBtn" class="primary">Save Changes</button>
        </div>
      `,
      })
      .then(() => {
        console.log("Form modal closed");
      });

    // Wait for the modal to be added to the DOM
    setTimeout(() => {
      document.getElementById("cancelBtn").onclick = (e) => {
        e.preventDefault();
        modalService
          .confirm({
            title: "Discard Changes",
            message: "Are you sure you want to discard your changes?",
            confirmText: "Discard",
            cancelText: "Keep Editing",
          })
          .then((confirmed) => {
            if (confirmed) {
              const modal = e.target.closest("neo-modal");
              modal.open = false;
            }
          });
      };

      document.getElementById("saveBtn").onclick = (e) => {
        e.preventDefault();
        console.log("Saving changes...");
        const modal = e.target.closest("neo-modal");
        modal.open = false;
      };
    }, 0);
  };

  return button;
};

// Long content with scrolling
export const LongContent = () => {
  const button = document.createElement("button");
  button.textContent = "Open Long Content";

  button.onclick = () => {
    modalService.show({
      title: "Terms of Service",
      size: "lg",
      innerHTML: `
        <div style="padding: 1rem;">
          ${Array.from(
            { length: 20 },
            (_, i) => `
            <h3>Section ${i + 1}</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
              ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat.
            </p>
          `
          ).join("")}
        </div>
      `,
      footerHTML: `
        <div slot="footer">
          <button onclick="this.closest('neo-modal').open = false">Close</button>
        </div>
      `,
    });
  };

  return button;
};

// Multiple modals
export const MultipleModals = () => html`
  <div style="display: flex; gap: 1rem;">
    <button
      @click=${() => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            modalService.show({
              title: "Modal " + (i + 1),
              size: "sm",
              position: ["center", "top-right", "bottom-left"][i],
              innerHTML: `
                <div style="padding: 1rem;">
                  <p>This is modal ${i + 1} of 3.</p>
                </div>
              `,
            });
          }, i * 500);
        }
      }}
    >
      Open Multiple
    </button>
    <button @click=${() => modalService.closeAll()}>Close All</button>
  </div>
`;
