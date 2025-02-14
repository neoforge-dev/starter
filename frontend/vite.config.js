import { defineConfig } from "vite";
import { createFilter } from "@rollup/pluginutils";
import { criticalCSSPlugin } from "./build/plugins/critical-css.js";

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
    rollupOptions: {
      input: {
        main: "./index.html",
      },
      output: {
        format: "esm",
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks: {
          vendor: ["lit", "@lit/reactive-element", "lit-html"],
          components: [
            "/src/components/core/**/*.js",
            "/src/components/atoms/**/*.js",
          ],
          pages: ["/src/pages/**/*.js"],
        },
      },
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
      "@components": "/src/components",
      "@services": "/src/services",
      "@utils": "/src/utils",
      "@pages": "/src/pages",
    },
  },
  optimizeDeps: {
    include: ["lit"],
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
});
