import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@styles": resolve(__dirname, "../src/styles"),
      "@services": resolve(__dirname, "../src/services"),
      "@utils": resolve(__dirname, "../src/utils"),
      "@components": resolve(__dirname, "../src/components"),
      "@": resolve(__dirname, "../src"),
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
  optimizeDeps: {
    include: ["lit", "@lit/reactive-element", "lit-html", "lit-element"],
    exclude: ["fsevents"],
  },
  esbuild: {
    logOverride: {
      "this-is-undefined-in-esm": "silent",
    },
  },
  plugins: [
    {
      name: "template-literal-loader",
      transform(code, id) {
        if (id.endsWith(".stories.js") || id.endsWith(".stories.ts")) {
          // Replace template literals with escaped versions
          return code.replace(/html`/g, "html\\`");
        }
      },
    },
  ],
});
