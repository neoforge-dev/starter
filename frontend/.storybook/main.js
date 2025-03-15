import { templateLiteralPlugin } from "./plugins/template-literal-plugin.js";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
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
      plugins: [...(config.plugins || []), templateLiteralPlugin()],
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include || []).filter(
            (dep) => dep !== "chart.js"
          ),
          "lit",
          "lit-html",
          "lit-element",
          "@lit/reactive-element",
        ],
        exclude: [
          ...(config.optimizeDeps?.exclude || []),
          "fsevents",
          "chart.js",
        ],
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
        alias: {
          ...config.resolve?.alias,
          "lit/decorators.js": "lit/decorators.js",
          "lit/directives/": "lit/directives/",
          "lit/": "lit/",
          "lit-html/": "lit-html/",
          "lit-element/": "lit-element/",
          "@lit/reactive-element/": "@lit/reactive-element/",
          "lit/css": path.resolve(__dirname, "./lit-css.js"),
        },
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
