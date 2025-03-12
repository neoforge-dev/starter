import { templateLiteralPlugin } from "./plugins/template-literal-plugin.js";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";

/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: [
    "../src/stories/simple-button.stories.js",
  ],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/web-components-vite",
    options: {},
  },
  docs: {
    autodocs: true,
  },
  core: {
    disableTelemetry: true,
    builder: "@storybook/builder-vite",
  },
  features: {
    storyStoreV7: true,
  },
  async viteFinal(config) {
    // Customize Vite config for Storybook
    return {
      ...config,
      define: {
        ...config.define,
        global: "window",
      },
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include || []),
          "lit",
          "lit-html",
          "lit-element",
          "@lit/reactive-element",
        ],
        exclude: [...(config.optimizeDeps?.exclude || []), "fsevents", "chart.js"],
      },
      resolve: {
        ...config.resolve,
        dedupe: [
          ...(config.resolve?.dedupe || []),
          "lit",
          "lit-html",
          "lit-element",
          "@lit/reactive-element",
        ],
      },
      build: {
        ...config.build,
        sourcemap: true,
        commonjsOptions: {
          ...config.build?.commonjsOptions,
          include: [/node_modules/],
        },
      },
      css: {
        postcss: {
          plugins: [
            autoprefixer,
            postcssPresetEnv({
              stage: 3,
              features: {
                "nesting-rules": true,
                "custom-media-queries": true,
                "media-query-ranges": true,
              },
            }),
            cssnano({
              preset: "default",
            }),
          ],
        },
      },
    };
  },
};

export default config;
