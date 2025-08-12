// LanguageSelector class import removed - not used
import {   html   } from 'lit';

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
