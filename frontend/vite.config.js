import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
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
    rollupOptions: {
      output: {
        format: "esm",
      },
    },
  },
  resolve: {
    alias: {
      "@components": "/src/components",
      "@services": "/src/services",
      "@utils": "/src/utils",
    },
  },
  optimizeDeps: {
    include: ["lit"],
  },
  plugins: [],
});
