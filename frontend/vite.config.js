import { defineConfig } from "vite";
import { createFilter } from "@rollup/pluginutils";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";

// Plugin to extract critical CSS
function criticalCssPlugin() {
  return {
    name: "critical-css",
    transform(code, id) {
      const filter = createFilter("src/**/critical.css");
      if (!filter(id)) return null;

      // Transform CSS to JS module that injects critical CSS
      const transformedCode = `const style = document.createElement('style');
style.setAttribute('critical', '');
style.textContent = ${JSON.stringify(code)};
document.head.appendChild(style);
export default style;`;

      return {
        code: transformedCode,
        map: null
      };
    },
    generateBundle(options, bundle) {
      // Process any critical CSS files in the bundle
      Object.keys(bundle).forEach(fileName => {
        if (fileName.includes('critical') && bundle[fileName].type === 'asset') {
          // Mark as processed
          bundle[fileName].fileName = fileName.replace('.css', '.js');
        }
      });
    }
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
      "@open-wc/testing-helpers",
    ],
    exclude: ["fsevents"],
    esbuildOptions: {
      target: "es2022",
      supported: {
        "top-level-await": true,
        decorators: true,
      },
      plugins: [],
    },
    esbuild: {
      target: "es2020",
      supported: {
        decorators: true,
      },
    },
  },
  plugins: [
    // criticalCssPlugin(), // Temporarily disabled due to build issues
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
  ],
});
