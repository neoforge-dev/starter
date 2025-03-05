import { defineConfig } from "vite";
import { createFilter } from "@rollup/pluginutils";
import { criticalCSSPlugin } from "./build/plugins/critical-css.js";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

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
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
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
          chart: ["chart.js"],
          lit: ["lit", "@lit/reactive-element", "lit-html", "lit-element"],
          analytics: [
            "./src/components/analytics/performance-chart.js",
            "./src/components/analytics/error-log.js",
            "./src/components/analytics/user-behavior.js",
          ],
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
    chunkSizeWarningLimit: 500,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.mjs"],
    include: ["src/**/*.test.js"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
    esbuild: {
      target: "es2020",
      supported: {
        decorators: true,
      },
    },
  },
  resolve: {
    alias: {
      "@styles": resolve(__dirname, "src/styles"),
      "@services": resolve(__dirname, "src/services"),
      "@utils": resolve(__dirname, "src/utils"),
      "@components": resolve(__dirname, "src/components"),
      lit: "lit",
      "lit/decorators": "lit/decorators",
      "lit-html": "lit-html",
      "@lit/reactive-element": "@lit/reactive-element",
      chai: "chai/chai.js",
      "@": resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "chart.js",
      "lit",
      "@lit/reactive-element",
      "lit-html",
      "lit-element",
      "@web/test-runner",
      "@web/components",
      "@open-wc/testing-helpers",
    ],
    esbuildOptions: {
      target: "es2022",
      supported: {
        "top-level-await": true,
        decorators: true,
      },
      plugins: [
        {
          name: "external-lit",
          setup(build) {
            build.onResolve({ filter: /^lit.*/ }, (args) => {
              return { path: args.path, external: true };
            });
          },
        },
      ],
    },
    esbuild: {
      target: "es2020",
      supported: {
        decorators: true,
      },
    },
  },
  plugins: [
    criticalCssPlugin(),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
  ],
});
