import fs from "fs";

/**
 * Plugin to handle template literals in stories
 * This is needed because Storybook's esbuild has issues with template literals in stories
 */
export function templateLiteralPlugin() {
  return {
    name: "template-literal-plugin",
    setup(build) {
      // Process .stories.js files
      build.onLoad({ filter: /\.stories\.js$/ }, async (args) => {
        // Read the file
        const source = fs.readFileSync(args.path, "utf8");

        // Replace template literals with string literals
        // This regex handles multiline template literals with ${} expressions
        const contents = source.replace(
          /html`([\s\S]*?)`/g,
          (match, content) => {
            // Escape backticks and dollar signs
            const escaped = content
              .replace(/`/g, "\\`")
              .replace(/\${/g, "\\${");

            // Return as a string
            return `html(\`${escaped}\`)`;
          }
        );

        return {
          contents,
          loader: "js",
        };
      });
    },
  };
}
