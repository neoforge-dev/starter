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
    host: "0.0.0.0", // Allow external connections for better development
    open: true,
    strictPort: false,
    watch: {
      usePolling: false, // Disabled for better performance with Bun
      ignored: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },
    hmr: {
      overlay: true,
      port: 3001, // Separate HMR port for better performance
    },
    // Optimize middleware for faster responses
    middlewareMode: false,
    // Enable HTTP/2 for better performance (if supported)
    https: false,
    // Optimize file serving
    fs: {
      strict: false,
      allow: [".."],
      deny: [".env", ".env.*", "*.{crt,pem}"],
    },
    // Pre-transform known imports for faster dev server startup
    warmup: {
      clientFiles: [
        "./src/main.js",
        "./src/components/**/*.js",
        "./src/services/**/*.js",
        "./src/pages/**/*.js",
      ],
    },
  },
  build: {
    target: "es2022", // Upgraded for better Bun compatibility
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2, // Additional compression passes for smaller bundles
      },
      mangle: {
        safari10: false, // Disable safari10 support for better performance
      },
    },
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: "lightningcss",
    outDir: "dist",
    reportCompressedSize: false, // Disable gzip reporting for faster builds
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        format: "esm",
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks(id) {
          // Vendor chunk for external dependencies
          if (id.includes('node_modules')) {
            // Split large vendors into separate chunks
            if (id.includes('lit')) return 'vendor-lit';
            if (id.includes('chart.js')) return 'vendor-chart';
            if (id.includes('@open-wc')) return 'vendor-testing';
            return 'vendor';
          }
          
          // Split by component type for better caching
          if (id.includes('/atoms/')) return 'components-atoms';
          if (id.includes('/molecules/')) return 'components-molecules';
          if (id.includes('/organisms/')) return 'components-organisms';
          if (id.includes('/pages/')) return 'pages';
          if (id.includes('/services/')) return 'services';
          if (id.includes('/utils/')) return 'utils';
          
          // Analytics components as separate chunk
          if (id.includes('/analytics/')) return 'analytics';
          
          // Critical components that should be in main bundle
          if (id.includes('/components/base/') || 
              id.includes('main.js') || 
              id.includes('app.js')) {
            return undefined; // Include in main bundle
          }
        },
        // Optimize chunk generation for faster builds
        generatedCode: {
          constBindings: true,
          objectShorthand: true,
          reservedNamesAsProps: false,
        },
      },
      external: [/^node:.*$/],
      treeshake: {
        preset: "recommended",
        moduleSideEffects: (id) => {
          // CSS files have side effects
          if (id.endsWith('.css')) return true;
          // Service workers have side effects
          if (id.includes('sw.js') || id.includes('service-worker')) return true;
          // Everything else can be tree-shaken
          return false;
        },
        manualPureFunctions: [
          "console.log", 
          "console.warn", 
          "console.info",
          "console.debug",
          "performance.mark",
          "performance.measure"
        ],
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
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
            preset: ["default", {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
            }],
          }),
        ],
      },
      extract: {
        filename: "assets/[name].[hash].css",
      },
    },
    chunkSizeWarningLimit: 1000, // Increased limit to reduce warnings
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
      // Optimize for Bun runtime
      minify: false, // Let terser handle minification for consistency
      sourcemap: false, // Disable source maps for faster builds
      keepNames: false,
    },
    esbuild: {
      target: "es2022", // Upgraded from es2020 for better Bun compatibility
      supported: {
        decorators: true,
        "top-level-await": true,
      },
      minify: false,
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
    force: true, // Force re-optimization for Bun compatibility
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
