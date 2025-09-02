import "./slider.js";

export default {
  title: "Atoms/Slider",
  component: "neo-slider",
  parameters: {
    docs: {
      description: {
        component: `
A flexible slider component for numeric input with visual feedback, perfect for settings, pricing, filters, and any numeric range selection.

## Features
- Smooth sliding interaction with visual feedback
- Customizable range (min/max values)
- Step increment control
- Multiple size variants (sm, md, lg)
- Visual variants with different colors
- Tick marks and custom marks
- Value formatting and display options
- Full accessibility support with ARIA attributes
- Keyboard navigation support
- Touch-friendly design

## Usage
\`\`\`html
<neo-slider
  label="Volume"
  min="0"
  max="100"
  value="75"
  valueSuffix="%"
  showTicks
></neo-slider>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: { type: "number", min: 0, max: 100 },
      description: "Current value of the slider",
    },
    min: {
      control: { type: "number" },
      description: "Minimum value",
    },
    max: {
      control: { type: "number" },
      description: "Maximum value",
    },
    step: {
      control: { type: "number", min: 0.1 },
      description: "Step increment between values",
    },
    label: {
      control: "text",
      description: "Label text displayed above the slider",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Size of the slider",
    },
    variant: {
      control: "radio",
      options: ["default", "primary", "success", "warning", "error"],
      description: "Visual variant for different contexts",
    },
    valuePrefix: {
      control: "text",
      description: "Prefix for displayed value (e.g., '$')",
    },
    valueSuffix: {
      control: "text",
      description: "Suffix for displayed value (e.g., '%', 'px')",
    },
    showValue: {
      control: "boolean",
      description: "Whether to show the current value",
    },
    showTicks: {
      control: "boolean",
      description: "Whether to show tick marks",
    },
    showLabels: {
      control: "boolean",
      description: "Whether to show min/max labels",
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
    },
    readonly: {
      control: "boolean",
      description: "Whether the slider is read-only",
    },
  },
};

const Template = (args) => {
  const slider = document.createElement("neo-slider");
  
  Object.keys(args).forEach((key) => {
    if (args[key] !== undefined && args[key] !== null) {
      if (typeof args[key] === "boolean") {
        if (args[key]) {
          slider.setAttribute(key, "");
        }
      } else {
        slider.setAttribute(key, args[key]);
      }
    }
  });

  return slider;
};

export const Default = Template.bind({});
Default.args = {
  label: "Default Slider",
  value: 50,
  min: 0,
  max: 100,
  step: 1,
};

export const WithValue = Template.bind({});
WithValue.args = {
  label: "Volume Control",
  value: 75,
  min: 0,
  max: 100,
  valueSuffix: "%",
  showTicks: true,
  showLabels: true,
};

export const PricingSlider = Template.bind({});
PricingSlider.args = {
  label: "Price Range",
  value: 250,
  min: 0,
  max: 500,
  step: 25,
  valuePrefix: "$",
  showTicks: true,
  showLabels: true,
  variant: "primary",
};

export const Sizes = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 2rem;";

  const sizes = ["sm", "md", "lg"];
  sizes.forEach((size) => {
    const slider = Template({
      label: `Size: ${size}`,
      value: 60,
      size,
      showTicks: true,
    });
    container.appendChild(slider);
  });

  return container;
};

export const Variants = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem;";

  const variants = [
    { variant: "default", label: "Default", value: 30 },
    { variant: "primary", label: "Primary", value: 50 },
    { variant: "success", label: "Success", value: 70 },
    { variant: "warning", label: "Warning", value: 85 },
    { variant: "error", label: "Error", value: 95 },
  ];

  variants.forEach(({ variant, label, value }) => {
    const slider = Template({
      label,
      value,
      variant,
      showValue: true,
      showTicks: true,
    });
    container.appendChild(slider);
  });

  return container;
};

export const WithCustomMarks = () => {
  const slider = Template({
    label: "Performance Level",
    value: 3,
    min: 1,
    max: 5,
    step: 1,
    showValue: false,
  });

  // Add custom marks
  slider.marks = [
    { value: 1, label: "Basic" },
    { value: 2, label: "Good" },
    { value: 3, label: "Better" },
    { value: 4, label: "Great" },
    { value: 5, label: "Excellent" },
  ];

  return slider;
};

export const TemperatureControl = Template.bind({});
TemperatureControl.args = {
  label: "Temperature",
  value: 22,
  min: 10,
  max: 35,
  step: 0.5,
  valueSuffix: "°C",
  showTicks: true,
  showLabels: true,
  variant: "warning",
};

export const ProgressIndicator = Template.bind({});
ProgressIndicator.args = {
  label: "Download Progress",
  value: 65,
  min: 0,
  max: 100,
  valueSuffix: "%",
  readonly: true,
  variant: "success",
  showTicks: false,
};

export const States = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem;";

  const states = [
    { label: "Normal", value: 50 },
    { label: "Disabled", value: 30, disabled: true },
    { label: "Read-only", value: 80, readonly: true },
  ];

  states.forEach((state) => {
    const slider = Template({
      ...state,
      showTicks: true,
      showLabels: true,
    });
    container.appendChild(slider);
  });

  return container;
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  label: "Hidden Value Slider",
  value: 75,
  showValue: false,
  showTicks: true,
  showLabels: true,
};

export const StepControl = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem;";

  const steps = [
    { label: "Step: 1", step: 1, value: 50 },
    { label: "Step: 5", step: 5, value: 50 },
    { label: "Step: 10", step: 10, value: 50 },
    { label: "Step: 0.1 (decimal)", step: 0.1, value: 5.5, min: 0, max: 10 },
  ];

  steps.forEach((config) => {
    const slider = Template({
      ...config,
      showTicks: true,
      showLabels: true,
    });
    container.appendChild(slider);
  });

  return container;
};

export const BudgetRange = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem; max-width: 400px;";

  const title = document.createElement("h3");
  title.textContent = "Budget Planning";
  title.style.margin = "0 0 1rem 0";
  container.appendChild(title);

  const sliders = [
    {
      label: "Monthly Budget",
      value: 2500,
      min: 0,
      max: 5000,
      step: 100,
      valuePrefix: "$",
      variant: "primary",
    },
    {
      label: "Marketing %",
      value: 20,
      min: 0,
      max: 50,
      step: 5,
      valueSuffix: "%",
      variant: "success",
    },
    {
      label: "Development %",
      value: 40,
      min: 0,
      max: 80,
      step: 5,
      valueSuffix: "%",
      variant: "warning",
    },
  ];

  sliders.forEach((config) => {
    const slider = Template({
      ...config,
      showTicks: true,
      showLabels: true,
    });
    container.appendChild(slider);
  });

  return container;
};

export const Interactive = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem; max-width: 500px;";

  const slider = Template({
    label: "Interactive Example",
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    valueSuffix: "%",
    showTicks: true,
    showLabels: true,
  });

  const output = document.createElement("div");
  output.style.cssText = "padding: 1rem; background: #f5f5f5; border-radius: 4px; font-family: monospace;";
  output.innerHTML = `
    <div>Value: <span id="value">50</span>%</div>
    <div>Percentage: <span id="percentage">50</span>%</div>
    <div>Events fired: <span id="events">0</span></div>
  `;

  let eventCount = 0;

  slider.addEventListener("input", (e) => {
    const value = e.detail.value;
    output.querySelector("#value").textContent = value;
    output.querySelector("#percentage").textContent = ((value / 100) * 100).toFixed(0);
    output.querySelector("#events").textContent = ++eventCount;
  });

  slider.addEventListener("change", (e) => {
    console.log("Slider change event:", e.detail.value);
  });

  container.appendChild(slider);
  container.appendChild(output);
  return container;
};

export const Accessibility = Template.bind({});
Accessibility.args = {
  label: "Accessible Slider",
  value: 42,
  min: 0,
  max: 100,
  step: 1,
  valueSuffix: "%",
  showTicks: true,
  showLabels: true,
};
Accessibility.parameters = {
  docs: {
    description: {
      story: `
This story demonstrates the comprehensive accessibility features:
- Proper ARIA attributes (aria-valuemin, aria-valuemax, aria-valuenow, aria-valuetext)
- Screen reader announcements for value changes
- Keyboard navigation support (arrow keys, home/end keys)
- Focus management with visible focus indicators
- Semantic HTML structure
      `,
    },
  },
};