import "./textarea.js";

export default {
  title: "Atoms/TextArea",
  component: "neo-textarea",
  parameters: {
    docs: {
      description: {
        component: `
A flexible textarea component for multi-line text input with comprehensive features including auto-resize, character counting, validation states, and full accessibility support.

## Features
- Auto-resize functionality
- Character counter with limit validation
- Multiple size variants (sm, md, lg)
- Visual variants (default, success, error, warning)
- Comprehensive accessibility support
- Form integration ready
- Customizable resize behavior
- Helper and error text support

## Usage
\`\`\`html
<neo-textarea
  label="Description"
  placeholder="Enter your description..."
  maxlength="500"
  showCounter
></neo-textarea>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: "text",
      description: "The current value of the textarea",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text shown when textarea is empty",
    },
    label: {
      control: "text",
      description: "Label text displayed above the textarea",
    },
    rows: {
      control: { type: "number", min: 1, max: 20 },
      description: "Number of visible text rows",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Size of the textarea",
    },
    variant: {
      control: "radio",
      options: ["default", "success", "error", "warning"],
      description: "Visual variant for validation states",
    },
    resize: {
      control: "radio",
      options: ["none", "both", "horizontal", "vertical"],
      description: "CSS resize behavior",
    },
    maxlength: {
      control: { type: "number", min: 0 },
      description: "Maximum number of characters allowed",
    },
    minlength: {
      control: { type: "number", min: 0 },
      description: "Minimum number of characters required",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the textarea",
    },
    errorText: {
      control: "text",
      description: "Error text displayed when validation fails",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
    readonly: {
      control: "boolean",
      description: "Whether the textarea is read-only",
    },
    required: {
      control: "boolean",
      description: "Whether the textarea is required",
    },
    autoResize: {
      control: "boolean",
      description: "Whether to automatically resize based on content",
    },
    showCounter: {
      control: "boolean",
      description: "Whether to show character counter",
    },
  },
};

const Template = (args) => {
  const textarea = document.createElement("neo-textarea");
  
  Object.keys(args).forEach((key) => {
    if (args[key] !== undefined && args[key] !== null) {
      if (typeof args[key] === "boolean") {
        if (args[key]) {
          textarea.setAttribute(key, "");
        }
      } else {
        textarea.setAttribute(key, args[key]);
      }
    }
  });

  return textarea;
};

export const Default = Template.bind({});
Default.args = {
  label: "Description",
  placeholder: "Enter your description...",
  rows: 4,
};

export const WithValue = Template.bind({});
WithValue.args = {
  label: "Bio",
  value: "I'm a passionate developer who loves creating intuitive user experiences. I have been working with web technologies for over 5 years and enjoy learning new frameworks and tools.",
  rows: 4,
};

export const WithCharacterCounter = Template.bind({});
WithCharacterCounter.args = {
  label: "Comment",
  placeholder: "Share your thoughts...",
  maxlength: 200,
  showCounter: true,
  helperText: "Please keep your comment concise and relevant",
};

export const AutoResize = Template.bind({});
AutoResize.args = {
  label: "Auto-resizing textarea",
  placeholder: "Type here and watch it grow...",
  autoResize: true,
  minRows: 2,
};

export const Sizes = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem;";

  const sizes = ["sm", "md", "lg"];
  sizes.forEach((size) => {
    const textarea = Template({
      label: `Size: ${size}`,
      placeholder: `This is a ${size} textarea`,
      size,
      rows: 3,
    });
    container.appendChild(textarea);
  });

  return container;
};

export const Variants = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem;";

  const variants = [
    { variant: "default", label: "Default", helperText: "Default textarea styling" },
    { variant: "success", label: "Success", helperText: "Input validated successfully" },
    { variant: "error", label: "Error", errorText: "This field contains an error" },
    { variant: "warning", label: "Warning", helperText: "Please review your input" },
  ];

  variants.forEach(({ variant, label, helperText, errorText }) => {
    const textarea = Template({
      label,
      placeholder: `${variant} textarea`,
      variant,
      helperText,
      errorText,
      rows: 3,
    });
    container.appendChild(textarea);
  });

  return container;
};

export const States = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem;";

  const states = [
    { label: "Normal", placeholder: "Normal textarea" },
    { label: "Disabled", placeholder: "Disabled textarea", disabled: true },
    { label: "Read-only", value: "This is read-only content", readonly: true },
    { label: "Required", placeholder: "Required textarea", required: true },
  ];

  states.forEach((state) => {
    const textarea = Template({
      ...state,
      rows: 3,
    });
    container.appendChild(textarea);
  });

  return container;
};

export const ResizeOptions = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;";

  const resizeOptions = ["none", "both", "horizontal", "vertical"];
  resizeOptions.forEach((resize) => {
    const textarea = Template({
      label: `Resize: ${resize}`,
      placeholder: `Resize: ${resize}`,
      resize,
      rows: 4,
    });
    container.appendChild(textarea);
  });

  return container;
};

export const FormIntegration = () => {
  const form = document.createElement("form");
  form.style.cssText = "display: flex; flex-direction: column; gap: 1rem; max-width: 500px;";
  
  const fields = [
    {
      label: "Subject",
      name: "subject",
      placeholder: "Brief subject line",
      rows: 2,
      required: true,
      maxlength: 100,
      showCounter: true,
    },
    {
      label: "Message",
      name: "message",
      placeholder: "Your detailed message...",
      rows: 6,
      required: true,
      maxlength: 1000,
      showCounter: true,
      helperText: "Please provide as much detail as possible",
    },
    {
      label: "Additional Notes",
      name: "notes",
      placeholder: "Any additional information (optional)",
      rows: 3,
      maxlength: 500,
      showCounter: true,
    },
  ];

  fields.forEach((field) => {
    const textarea = Template(field);
    form.appendChild(textarea);
  });

  // Add submit button
  const button = document.createElement("neo-button");
  button.setAttribute("type", "submit");
  button.setAttribute("variant", "primary");
  button.textContent = "Submit Form";
  form.appendChild(button);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Form submitted");
  });

  return form;
};

export const Accessibility = Template.bind({});
Accessibility.args = {
  label: "Accessible Textarea",
  placeholder: "This textarea has comprehensive accessibility support",
  required: true,
  helperText: "Screen readers will announce this as a required field with helper text",
  rows: 4,
};
Accessibility.parameters = {
  docs: {
    description: {
      story: `
This story demonstrates the comprehensive accessibility features:
- Proper labeling and associations
- ARIA attributes for validation states
- Screen reader announcements
- Keyboard navigation support
- Focus management
      `,
    },
  },
};

export const Interactive = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem; max-width: 500px;";

  const textarea = Template({
    label: "Interactive Example",
    placeholder: "Type here to see real-time feedback...",
    maxlength: 200,
    showCounter: true,
    autoResize: true,
  });

  const output = document.createElement("div");
  output.style.cssText = "padding: 1rem; background: #f5f5f5; border-radius: 4px; font-family: monospace; white-space: pre-wrap;";
  output.textContent = "Value: (empty)\nLength: 0\nWords: 0";

  textarea.addEventListener("input", (e) => {
    const value = e.detail.value;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    output.textContent = `Value: ${value}\nLength: ${value.length}\nWords: ${words}`;
  });

  container.appendChild(textarea);
  container.appendChild(output);
  return container;
};