export default {
  title: "Atoms/Heading",
  component: "neo-heading",
  parameters: {
    docs: {
      description: {
        component: `
The Heading component provides semantic heading levels with independent visual styling control.

## Features
- Semantic levels (h1-h6) with visual styling separation
- Responsive typography using CSS custom properties
- Multiple size overrides (xs, sm, md, lg, xl, 2xl, 3xl)
- Color variants (default, muted, primary, secondary, error, success, warning)
- Font weight control (normal, medium, semibold, bold)
- Text alignment (left, center, right)
- Text truncation with ellipsis
- WCAG compliant styling and focus management

## Usage
Use this component for page titles, section headings, and any hierarchical text content. Separate semantic meaning from visual appearance for better accessibility.
        `,
      },
    },
  },
  argTypes: {
    level: {
      control: { type: "select" },
      options: ["1", "2", "3", "4", "5", "6"],
      description: "Semantic heading level (1-6)",
    },
    visualLevel: {
      control: { type: "select" },
      options: ["", "1", "2", "3", "4", "5", "6"],
      description: "Visual styling level (independent of semantic level)",
    },
    size: {
      control: { type: "select" },
      options: ["", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
      description: "Size override",
    },
    weight: {
      control: { type: "select" },
      options: ["", "normal", "medium", "semibold", "bold"],
      description: "Font weight",
    },
    color: {
      control: { type: "select" },
      options: ["default", "muted", "primary", "secondary", "error", "success", "warning"],
      description: "Text color",
    },
    truncate: {
      control: "boolean",
      description: "Whether to truncate long text with ellipsis",
    },
    align: {
      control: { type: "select" },
      options: ["left", "center", "right"],
      description: "Text alignment",
    },
    content: {
      control: "text",
      description: "Heading text content",
    },
  },
};

const Template = ({ content, ...args }) => {
  return `
    <neo-heading
      ${args.level ? `level="${args.level}"` : ""}
      ${args.visualLevel ? `visual-level="${args.visualLevel}"` : ""}
      ${args.size ? `size="${args.size}"` : ""}
      ${args.weight ? `weight="${args.weight}"` : ""}
      ${args.color ? `color="${args.color}"` : ""}
      ${args.truncate ? "truncate" : ""}
      ${args.align ? `align="${args.align}"` : ""}
    >
      ${content || "Heading Text"}
    </neo-heading>
  `;
};

export const Default = Template.bind({});
Default.args = {
  content: "Default Heading",
  level: "1",
};

export const SemanticLevels = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <neo-heading level="1">Heading Level 1</neo-heading>
      <neo-heading level="2">Heading Level 2</neo-heading>
      <neo-heading level="3">Heading Level 3</neo-heading>
      <neo-heading level="4">Heading Level 4</neo-heading>
      <neo-heading level="5">Heading Level 5</neo-heading>
      <neo-heading level="6">Heading Level 6</neo-heading>
    </div>
  `;
};

SemanticLevels.parameters = {
  docs: {
    description: {
      story: "Default styling for each semantic heading level.",
    },
  },
};

export const VisualLevelSeparation = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <neo-heading level="1" visual-level="3">H1 with H3 Visual Styling</neo-heading>
      <neo-heading level="2" visual-level="1">H2 with H1 Visual Styling</neo-heading>
      <neo-heading level="3" visual-level="5">H3 with H5 Visual Styling</neo-heading>
      <p style="margin: 1rem 0; color: #6b7280; font-size: 0.875rem;">
        This demonstrates how semantic meaning can be separate from visual appearance for better accessibility.
      </p>
    </div>
  `;
};

VisualLevelSeparation.parameters = {
  docs: {
    description: {
      story: "Examples showing how visual styling can be independent of semantic level.",
    },
  },
};

export const SizeOverrides = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <neo-heading level="2" size="xs">Extra Small (xs)</neo-heading>
      <neo-heading level="2" size="sm">Small (sm)</neo-heading>
      <neo-heading level="2" size="md">Medium (md)</neo-heading>
      <neo-heading level="2" size="lg">Large (lg)</neo-heading>
      <neo-heading level="2" size="xl">Extra Large (xl)</neo-heading>
      <neo-heading level="2" size="2xl">2X Large (2xl)</neo-heading>
      <neo-heading level="2" size="3xl">3X Large (3xl)</neo-heading>
    </div>
  `;
};

SizeOverrides.parameters = {
  docs: {
    description: {
      story: "Size overrides available for precise typography control.",
    },
  },
};

export const ColorVariants = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <neo-heading level="3" color="default">Default Color</neo-heading>
      <neo-heading level="3" color="muted">Muted Color</neo-heading>
      <neo-heading level="3" color="primary">Primary Color</neo-heading>
      <neo-heading level="3" color="secondary">Secondary Color</neo-heading>
      <neo-heading level="3" color="error">Error Color</neo-heading>
      <neo-heading level="3" color="success">Success Color</neo-heading>
      <neo-heading level="3" color="warning">Warning Color</neo-heading>
    </div>
  `;
};

ColorVariants.parameters = {
  docs: {
    description: {
      story: "Different color variants available for headings.",
    },
  },
};

export const FontWeights = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <neo-heading level="3" weight="normal">Normal Weight</neo-heading>
      <neo-heading level="3" weight="medium">Medium Weight</neo-heading>
      <neo-heading level="3" weight="semibold">Semibold Weight</neo-heading>
      <neo-heading level="3" weight="bold">Bold Weight</neo-heading>
    </div>
  `;
};

FontWeights.parameters = {
  docs: {
    description: {
      story: "Different font weights available for headings.",
    },
  },
};

export const TextAlignment = () => {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <neo-heading level="3" align="left">Left Aligned</neo-heading>
      <neo-heading level="3" align="center">Center Aligned</neo-heading>
      <neo-heading level="3" align="right">Right Aligned</neo-heading>
    </div>
  `;
};

TextAlignment.parameters = {
  docs: {
    description: {
      story: "Text alignment options for headings.",
    },
  },
};

export const TruncatedText = Template.bind({});
TruncatedText.args = {
  content: "This is a very long heading that will be truncated with an ellipsis when it exceeds the container width",
  level: "2",
  truncate: true,
};

TruncatedText.decorators = [
  (story) => `<div style="width: 300px; border: 1px dashed #ccc; padding: 1rem;">${story}</div>`,
];

TruncatedText.parameters = {
  docs: {
    description: {
      story: "Example of text truncation with ellipsis for long headings.",
    },
  },
};

export const PageLayout = () => {
  return `
    <div style="max-width: 800px;">
      <neo-heading level="1" color="primary">Page Title</neo-heading>
      <p style="margin: 1rem 0; color: #6b7280;">
        This is the main page content that follows the primary heading.
      </p>

      <neo-heading level="2" style="margin-top: 2rem;">Section Heading</neo-heading>
      <p style="margin: 1rem 0; color: #6b7280;">
        This section contains important information about the topic.
      </p>

      <neo-heading level="3" style="margin-top: 1.5rem;">Subsection</neo-heading>
      <p style="margin: 1rem 0; color: #6b7280;">
        More detailed information in this subsection.
      </p>

      <neo-heading level="4" color="muted" style="margin-top: 1rem;">Details</neo-heading>
      <p style="margin: 1rem 0; color: #6b7280;">
        Fine-grained details and additional information.
      </p>
    </div>
  `;
};

PageLayout.parameters = {
  docs: {
    description: {
      story: "Example showing proper heading hierarchy in a typical page layout.",
    },
  },
};
