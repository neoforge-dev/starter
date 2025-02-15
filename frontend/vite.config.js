import { defineConfig } from "vite";
import { createFilter } from "@rollup/pluginutils";
import { criticalCSSPlugin } from "./build/plugins/critical-css.js";
import { resolve } from "path";

// Plugin to extract critical CSS
function criticalCssPlugin() {
  return {
    name: "critical-css",
    transform(code, id) {
      const filter = createFilter("src/**/critical.css");
      if (!filter(id)) return null;

      // Mark this CSS as critical
      return {
        code: `
          const style = document.createElement('style');
          style.setAttribute('critical', '');
          style.textContent = ${JSON.stringify(code)};
          document.head.appendChild(style);
          export default style;
        `,
        map: null,
      };
    },
  };
}

export default defineConfig({
  root: "./",
  base: "/",
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: "lightningcss",
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        format: "esm",
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks: {
          lit: ["lit", "lit/decorators.js", "lit-html", "lit-element"],
          vendor: ["highlight.js", "marked"],
        },
      },
      external: [/^node:.*$/],
    },
    css: {
      postcss: {
        plugins: [
          require("autoprefixer"),
          require("postcss-preset-env")({
            stage: 3,
            features: {
              "nesting-rules": true,
              "custom-media-queries": true,
              "media-query-ranges": true,
            },
          }),
          require("cssnano")({
            preset: [
              "advanced",
              {
                discardComments: { removeAll: true },
                reduceIdents: false,
                zindex: false,
              },
            ],
          }),
        ],
      },
      extract: {
        filename: "assets/[name].[hash].css",
      },
    },
  },
  resolve: {
    alias: {
      "@components": resolve(__dirname, "src/components"),
      "@pages": resolve(__dirname, "src/pages"),
      "@styles": resolve(__dirname, "src/styles"),
      "@utils": resolve(__dirname, "src/utils"),
      "@services": resolve(__dirname, "src/services"),
      "lit/decorators.js": resolve(__dirname, "node_modules/lit/decorators.js"),
      lit: resolve(__dirname, "node_modules/lit"),
      "lit-html": resolve(__dirname, "node_modules/lit-html"),
      "lit-element": resolve(__dirname, "node_modules/lit-element"),
      "@lit/reactive-element":
        "/node_modules/@lit/reactive-element/development/reactive-element.js",
      chai: "chai/chai.js",
      "lit/static-html.js": "lit/static-html.js",
      "lit/directives/unsafe-html.js": "lit/directives/unsafe-html.js",
      "lit/directive-helpers.js": "lit/directive-helpers.js",
      "lit/html.js": "lit/html.js",
    },
  },
  optimizeDeps: {
    include: ["lit", "chai", "@open-wc/testing-helpers"],
  },
  plugins: [
    criticalCSSPlugin({
      routes: [
        "/",
        "/docs",
        "/examples",
        "/auth/login",
        "/auth/register",
        "/dashboard",
      ],
      dimensions: [
        { width: 375, height: 812 }, // iPhone X
        { width: 768, height: 1024 }, // iPad
        { width: 1280, height: 800 }, // Laptop
        { width: 1920, height: 1080 }, // Desktop
      ],
      minify: true,
      inlineThreshold: 8192, // 8KB
    }),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "src/test/setup.js"],
    },
    alias: {
      lit: resolve(__dirname, "node_modules/lit/index.js"),
      "lit/decorators.js": resolve(__dirname, "node_modules/lit/decorators.js"),
      "lit/directives/": resolve(__dirname, "node_modules/lit/directives/"),
      "lit/static-html.js": resolve(
        __dirname,
        "node_modules/lit/static-html.js"
      ),
      "lit/html.js": resolve(__dirname, "node_modules/lit/html.js"),
      "@lit/reactive-element": resolve(
        __dirname,
        "node_modules/@lit/reactive-element/reactive-element.js"
      ),
      "@open-wc/testing-helpers": resolve(
        __dirname,
        "node_modules/@open-wc/testing-helpers/index.js"
      ),
      "@components": resolve(__dirname, "src/components"),
      "@pages": resolve(__dirname, "src/pages"),
      "@services": resolve(__dirname, "src/services"),
      "@utils": resolve(__dirname, "src/utils"),
      "../../src/components/ui/": resolve(__dirname, "src/components/ui/"),
      "../../components/ui/": resolve(__dirname, "src/components/ui/"),
      "../../pages/": resolve(__dirname, "src/pages/"),
      "../../services/": resolve(__dirname, "src/services/"),
    },
  },
});
