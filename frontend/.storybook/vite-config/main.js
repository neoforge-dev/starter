import { defineConfig } from "vite";
import { resolve } from "path";
export default defineConfig({
  resolve: {
    alias: {
      "@styles": resolve(__dirname, "../../src/styles"),
      "@services": resolve(__dirname, "../../src/services"),
      "@utils": resolve(__dirname, "../../src/utils"),
      "@components": resolve(__dirname, "../../src/components"),
      "@": resolve(__dirname, "../../src"),
    },
  },
});
