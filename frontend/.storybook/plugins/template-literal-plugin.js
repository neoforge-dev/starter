/**
 * This plugin handles template literals in story files.
 * It converts html template literals to function calls to avoid parsing issues.
 */

export function templateLiteralPlugin() {
  return {
    name: "template-literal-plugin",
    enforce: "pre", // Run this plugin before Vite's plugins
    transform(code, id) {
      // Only process story files
      if (!id.includes(".stories.")) {
        return null;
      }

      try {
        // Simple approach: replace html` with html(String.raw`
        // and add a closing ) at the end of the template literal
        let transformed = code;

        // Replace html` with html(String.raw`
        transformed = transformed.replace(/html`/g, "html(String.raw`");

        // Add closing parenthesis after backtick
        transformed = transformed.replace(
          /`(?=(\s*;|\s*,|\s*\)|\s*$|\s*\n))/g,
          "`)"
        );

        return {
          code: transformed,
          map: null,
        };
      } catch (error) {
        console.error(`Error transforming ${id}:`, error);
        return null;
      }
    },
  };
}
