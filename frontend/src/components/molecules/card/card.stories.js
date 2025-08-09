import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./card.js"; // Assuming card component is defined here
// Import other components if needed for slotted content examples
import "../../atoms/button/button.js";
// import '../../atoms/icon/icon.js';

export default {
  title: "Molecules/Card",
  component: "neo-card",
  argTypes: {
    header: {
      control: "text",
      description: "Optional card header text (prop)",
    },
    footer: {
      control: "text",
      description: "Optional card footer text (prop)",
    },
    imageUrl: {
      control: "text",
      description: "URL for an optional image at the top of the card",
    },
    imageAlt: {
      control: "text",
      description: "Alt text for the card image",
    },
    noPadding: {
      control: "boolean",
      description: "Remove default padding from the card body",
    },
    clickable: {
      control: "boolean",
      description: "Make the entire card clickable (adds hover effect)",
    },
    href: {
      control: "text",
      description: "URL to navigate to if the card is clickable",
    },
    // Default slot control (for simple text)
    content: {
      control: "text",
      description: "Main content for the card body (default slot)",
      table: { category: "Slots" }, // Indicate this controls slot content
    },
  },
  parameters: {
    docs: {
      description: {
        component: "A flexible content container component.",
      },
      // Optional: Document slots explicitly if needed
      // slots: {
      //   '': { description: 'Default slot for card body content.' },
      //   header: { description: 'Slot for custom header content.' },
      //   footer: { description: 'Slot for custom footer content.' },
      // },
    },
  },
};

// Template for stories primarily controlled by props/args
const Template = ({
  header,
  footer,
  imageUrl,
  imageAlt,
  noPadding,
  clickable,
  href,
  content,
}) => html`
  <neo-card
    header=${header || ""}
    footer=${footer || ""}
    imageUrl=${imageUrl || ""}
    imageAlt=${imageAlt || ""}
    ?no-padding=${noPadding}
    ?clickable=${clickable}
    href=${href || ""}
  >
    ${content || "This is the main content area of the card."}
  </neo-card>
`;

export const Default = Template.bind({});
Default.args = {
  header: "Card Header",
  footer: "Card Footer",
  content: "This card has a header, footer, and default body content.",
};

export const Simple = Template.bind({});
Simple.args = {
  content: "This is a simple card with only body content.",
};

export const WithImage = Template.bind({});
WithImage.args = {
  header: "Image Card",
  imageUrl: "https://via.placeholder.com/400x200",
  imageAlt: "Placeholder image",
  content: "This card features an image at the top.",
  footer: "Image Footer",
};

export const Clickable = Template.bind({});
Clickable.args = {
  header: "Clickable Card",
  content: "This entire card is clickable and has hover effects.",
  clickable: true,
  href: "#",
};

export const NoPadding = Template.bind({});
NoPadding.args = {
  header: "No Padding Card",
  content: "The body of this card has no internal padding.",
  noPadding: true,
};

// Story demonstrating custom slots directly
export const CustomHeaderFooterSlots = () => html`
  <neo-card>
    <div slot="header">Custom <strong>Header</strong> Slot</div>
    Main body content for the card with custom slots.
    <div slot="footer">
      <neo-button size="small">Action</neo-button>
    </div>
  </neo-card>
`;
CustomHeaderFooterSlots.parameters = {
  controls: { hideNoControlsWarning: true }, // Hide controls as they aren't used
};

// Story demonstrating complex slotted content
export const ComplexContent = () => html`
  <neo-card
    header="Complex Card Header Prop"
    imageUrl="https://via.placeholder.com/400x200"
    imageAlt="Placeholder image"
  >
    <h4>Sub-heading in Default Slot</h4>
    <p>Some paragraph text explaining the content further.</p>
    <ul>
      <li>List item 1</li>
      <li>List item 2</li>
    </ul>
    <div
      slot="footer"
      style="display: flex; justify-content: space-between; align-items: center;"
    >
      <span>Footer Info via Slot</span>
      <neo-button variant="primary">Go</neo-button>
    </div>
  </neo-card>
`;
ComplexContent.parameters = {
  controls: { hideNoControlsWarning: true },
};
