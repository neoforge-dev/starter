export default {
  title: "Atoms/Divider",
  component: "neo-divider",
  parameters: {
    docs: {
      description: {
        component: `
The Divider component provides visual separation between content sections with support for various orientations and styles.

## Features
- Horizontal and vertical orientations
- Multiple style variants (solid, dashed, dotted)
- Different thickness options (thin, medium, thick)
- Color variants (default, muted, primary, secondary)
- Optional content in the middle (text/icons)
- Responsive spacing control
- Semantic role="separator" for accessibility
- WCAG compliant styling

## Usage
Use this component to separate content sections, create visual breaks in layouts, or add decorative elements with optional labels.
        `,
      },
    },
  },
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
      description: "Orientation of the divider",
    },
    variant: {
      control: { type: "select" },
      options: ["solid", "dashed", "dotted"],
      description: "Style variant",
    },
    size: {
      control: { type: "select" },
      options: ["thin", "medium", "thick"],
      description: "Thickness/size of the divider",
    },
    color: {
      control: { type: "select" },
      options: ["default", "muted", "primary", "secondary"],
      description: "Color of the divider",
    },
    spacing: {
      control: { type: "select" },
      options: ["none", "sm", "md", "lg", "xl"],
      description: "Spacing around the divider",
    },
    decorative: {
      control: "boolean",
      description: "Whether this is purely decorative (affects ARIA)",
    },
    content: {
      control: "text",
      description: "Content to display in the middle of the divider",
    },
  },
};

const Template = ({ content, ...args }) => {
  return `
    <neo-divider 
      ${args.orientation ? `orientation="${args.orientation}"` : ""}
      ${args.variant ? `variant="${args.variant}"` : ""}
      ${args.size ? `size="${args.size}"` : ""}
      ${args.color ? `color="${args.color}"` : ""}
      ${args.spacing ? `spacing="${args.spacing}"` : ""}
      ${args.decorative ? "decorative" : ""}
    >
      ${content || ""}
    </neo-divider>
  `;
};

export const Default = Template.bind({});
Default.args = {};

export const WithText = Template.bind({});
WithText.args = {
  content: "or",
};

export const Variants = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 2rem; padding: 1rem;">
      <div>
        <h4 style="margin-bottom: 1rem;">Solid</h4>
        <neo-divider variant="solid"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Dashed</h4>
        <neo-divider variant="dashed"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Dotted</h4>
        <neo-divider variant="dotted"></neo-divider>
      </div>
    </div>
  `;
};

Variants.parameters = {
  docs: {
    description: {
      story: "Different style variants available for dividers.",
    },
  },
};

export const Sizes = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 2rem; padding: 1rem;">
      <div>
        <h4 style="margin-bottom: 1rem;">Thin (1px)</h4>
        <neo-divider size="thin"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Medium (2px)</h4>
        <neo-divider size="medium"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Thick (4px)</h4>
        <neo-divider size="thick"></neo-divider>
      </div>
    </div>
  `;
};

Sizes.parameters = {
  docs: {
    description: {
      story: "Different thickness options for dividers.",
    },
  },
};

export const Colors = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 2rem; padding: 1rem;">
      <div>
        <h4 style="margin-bottom: 1rem;">Default</h4>
        <neo-divider color="default"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Muted</h4>
        <neo-divider color="muted"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Primary</h4>
        <neo-divider color="primary"></neo-divider>
      </div>
      
      <div>
        <h4 style="margin-bottom: 1rem;">Secondary</h4>
        <neo-divider color="secondary"></neo-divider>
      </div>
    </div>
  `;
};

Colors.parameters = {
  docs: {
    description: {
      story: "Different color variants for dividers.",
    },
  },
};

export const WithContent = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 2rem; padding: 1rem;">
      <div>
        <p>Content above the divider</p>
        <neo-divider>or</neo-divider>
        <p>Content below the divider</p>
      </div>
      
      <div>
        <p>Another section</p>
        <neo-divider color="primary">AND</neo-divider>
        <p>More content here</p>
      </div>
      
      <div>
        <p>Login options</p>
        <neo-divider variant="dashed" color="muted">Continue with</neo-divider>
        <p>Social login buttons would go here</p>
      </div>
    </div>
  `;
};

WithContent.parameters = {
  docs: {
    description: {
      story: "Examples of dividers with text content in the middle.",
    },
  },
};

export const VerticalDividers = () => {
  return `
    <div style="display: flex; align-items: center; gap: 1rem; height: 100px; padding: 1rem;">
      <div>Section 1</div>
      <neo-divider orientation="vertical"></neo-divider>
      <div>Section 2</div>
      <neo-divider orientation="vertical" variant="dashed"></neo-divider>
      <div>Section 3</div>
      <neo-divider orientation="vertical" color="primary" size="medium"></neo-divider>
      <div>Section 4</div>
    </div>
  `;
};

VerticalDividers.parameters = {
  docs: {
    description: {
      story: "Examples of vertical dividers separating inline content.",
    },
  },
};

export const VerticalWithContent = () => {
  return `
    <div style="display: flex; align-items: center; gap: 1rem; height: 120px; padding: 1rem;">
      <div>Left Content</div>
      <neo-divider orientation="vertical">OR</neo-divider>
      <div>Right Content</div>
    </div>
  `;
};

VerticalWithContent.parameters = {
  docs: {
    description: {
      story: "Example of a vertical divider with content.",
    },
  },
};

export const SpacingOptions = () => {
  return `
    <div style="padding: 1rem;">
      <p>Content before</p>
      
      <neo-divider spacing="none">No spacing</neo-divider>
      <p>Immediately after</p>
      
      <neo-divider spacing="sm">Small spacing</neo-divider>
      <p>After small spacing</p>
      
      <neo-divider spacing="md">Medium spacing</neo-divider>
      <p>After medium spacing</p>
      
      <neo-divider spacing="lg">Large spacing</neo-divider>
      <p>After large spacing</p>
      
      <neo-divider spacing="xl">Extra large spacing</neo-divider>
      <p>After extra large spacing</p>
    </div>
  `;
};

SpacingOptions.parameters = {
  docs: {
    description: {
      story: "Different spacing options around dividers.",
    },
  },
};

export const FormSeparation = () => {
  return `
    <div style="max-width: 400px; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
      <h3 style="margin: 0 0 1rem 0;">Sign Up</h3>
      
      <form style="display: flex; flex-direction: column; gap: 1rem;">
        <input type="email" placeholder="Email" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
        <input type="password" placeholder="Password" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;" />
        <button type="submit" style="padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem;">Sign Up</button>
      </form>
      
      <neo-divider spacing="lg" color="muted">or</neo-divider>
      
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <button style="padding: 0.75rem; background: #4285f4; color: white; border: none; border-radius: 0.375rem;">Continue with Google</button>
        <button style="padding: 0.75rem; background: #1877f2; color: white; border: none; border-radius: 0.375rem;">Continue with Facebook</button>
      </div>
    </div>
  `;
};

FormSeparation.parameters = {
  docs: {
    description: {
      story: "Example of using dividers to separate form sections.",
    },
  },
};