import {  html  } from 'lit';
import "./color-picker.js";

export default {
  title: "Form/ColorPicker",
  component: "ui-color-picker",
  argTypes: {
    value: { control: "text" },
    mode: {
      control: "select",
      options: ["simple", "advanced", "palette", "gradient"],
    },
    format: { control: "select", options: ["hex", "rgb", "hsl"] },
    variant: { control: "select", options: ["default", "compact", "inline"] },
    disabled: { control: "boolean" },
    showHistory: { control: "boolean" },
    showOpacity: { control: "boolean" },
    presetColors: { control: "object" },
  },
};

const Template = (args) => html`
  <ui-color-picker
    .value=${args.value}
    .mode=${args.mode}
    .format=${args.format}
    .variant=${args.variant}
    ?disabled=${args.disabled}
    ?showHistory=${args.showHistory}
    ?showOpacity=${args.showOpacity}
    .presetColors=${args.presetColors}
    @change=${(e) => console.log("Color changed:", e.detail)}
  ></ui-color-picker>
`;

const defaultPresetColors = [
  // Primary Colors
  "#2563eb", // Blue
  "#7c3aed", // Purple
  "#db2777", // Pink
  "#dc2626", // Red
  "#ea580c", // Orange
  "#ca8a04", // Yellow
  "#16a34a", // Green
  "#0891b2", // Cyan

  // Grayscale
  "#000000",
  "#1f2937",
  "#4b5563",
  "#9ca3af",
  "#e5e7eb",
  "#f9fafb",
  "#ffffff",

  // Brand Colors
  "#38bdf8", // Light Blue
  "#818cf8", // Indigo
  "#f472b6", // Light Pink
  "#fb7185", // Light Red
  "#fb923c", // Light Orange
  "#fbbf24", // Light Yellow
  "#4ade80", // Light Green
  "#22d3ee", // Light Cyan
];

const gradientPresets = [
  {
    name: "Ocean",
    gradient: "linear-gradient(135deg, #0891b2 0%, #2563eb 100%)",
  },
  {
    name: "Sunset",
    gradient: "linear-gradient(135deg, #db2777 0%, #9333ea 100%)",
  },
  {
    name: "Forest",
    gradient: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
  },
  {
    name: "Fire",
    gradient: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
  },
];

export const Simple = Template.bind({});
Simple.args = {
  mode: "simple",
  format: "hex",
  variant: "default",
  value: "#2563eb",
  disabled: false,
  showHistory: true,
  showOpacity: false,
  presetColors: defaultPresetColors,
};

export const Advanced = Template.bind({});
Advanced.args = {
  mode: "advanced",
  format: "rgb",
  variant: "default",
  value: "rgb(37, 99, 235)",
  disabled: false,
  showHistory: true,
  showOpacity: true,
  presetColors: defaultPresetColors,
};

export const Palette = Template.bind({});
Palette.args = {
  mode: "palette",
  format: "hex",
  variant: "compact",
  value: "#2563eb",
  disabled: false,
  showHistory: false,
  showOpacity: false,
  presetColors: defaultPresetColors,
};

export const Gradient = Template.bind({});
Gradient.args = {
  mode: "gradient",
  format: "hex",
  variant: "default",
  value: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  disabled: false,
  showHistory: true,
  showOpacity: true,
  presetColors: gradientPresets,
};

export const Inline = Template.bind({});
Inline.args = {
  mode: "simple",
  format: "hex",
  variant: "inline",
  value: "#2563eb",
  disabled: false,
  showHistory: false,
  showOpacity: false,
  presetColors: defaultPresetColors.slice(0, 8),
};

export const Disabled = Template.bind({});
Disabled.args = {
  mode: "simple",
  format: "hex",
  variant: "default",
  value: "#2563eb",
  disabled: true,
  showHistory: true,
  showOpacity: false,
  presetColors: defaultPresetColors,
};
