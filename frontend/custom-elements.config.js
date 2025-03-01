import { defineConfig } from "@custom-elements-manifest/analyzer";

export default defineConfig({
  globs: ["src/components/**/*.js"],
  exclude: ["**/*.test.js", "**/*.stories.js"],
  plugins: [
    // Plugin to analyze Lit decorators
    {
      name: "lit-decorators",
      analyzePhase({ ts, node, context }) {
        if (ts.isClassDeclaration(node)) {
          const decorators = node.decorators;
          if (decorators) {
            decorators.forEach((decorator) => {
              if (decorator.expression.getText().includes("customElement")) {
                context.addCustomElement(node);
              }
            });
          }
        }
      },
    },
  ],
  packagejson: true,
  outdir: "docs/custom-elements.json",
  watch: process.argv.includes("--watch"),
  dev: process.argv.includes("--dev"),
});
