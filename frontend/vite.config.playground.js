/**
 * Vite configuration specifically for the Native Web Components Playground
 */
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: "./src/playground",
  publicDir: "../public",
  build: {
    outDir: "../../dist/playground",
    emptyOutDir: true,
    rollupOptions: {
      input: "advanced-playground.html",
    },
  },
  server: {
    port: 3001,
    open: "/advanced-playground.html",
  },
  resolve: {
    alias: {
      "@": pathResolve(__dirname, "src"),
      "/components": pathResolve(__dirname, "src/playground/components"),
    },
  },
});
