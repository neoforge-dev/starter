/** @type { import("@storybook/web-components-vite").StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-links",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/web-components-vite",
    "options": {}
  }
};
export default config;