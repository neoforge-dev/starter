import { LanguageSelector } from "./language-selector.js";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export default {
  title: "Components/Language Selector",
  component: "language-selector",
  tags: ["autodocs"],
  argTypes: {
    currentLocale: { control: "text" },
    supportedLocales: { control: "object" },
  },
};

export const Default = {
  args: {
    currentLocale: "en",
    supportedLocales: ["en", "es", "fr", "de"],
  },
  render: () => html`<language-selector></language-selector>`,
};
