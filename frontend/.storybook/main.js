import { dirname, join } from "path";

/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: [
    "../src/components/atoms/**/*.stories.@(js|jsx|ts|tsx|mdx)",
    "../src/components/molecules/**/*.stories.@(js|jsx|ts|tsx|mdx)",
    "../src/components/organisms/**/*.stories.@(js|jsx|ts|tsx|mdx)",
    "../src/components/templates/**/*.stories.@(js|jsx|ts|tsx|mdx)",
    "../src/components/pages/**/*.stories.@(js|jsx|ts|tsx|mdx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
    "storybook-addon-designs",
    "@storybook/addon-viewport",
    "@storybook/addon-storysource",
  ],
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
  docs: {
    autodocs: true,
    defaultName: "Documentation",
  },
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "@atoms": join(dirname(".."), "src/components/atoms"),
          "@molecules": join(dirname(".."), "src/components/molecules"),
          "@organisms": join(dirname(".."), "src/components/organisms"),
          "@templates": join(dirname(".."), "src/components/templates"),
          "@pages": join(dirname(".."), "src/components/pages"),
          "@tokens": join(dirname(".."), "src/components/tokens"),
        },
      },
    };
  },
};

export default config;
