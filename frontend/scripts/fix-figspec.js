#!/usr/bin/env node

/**
 * This script directly fixes the @figspec/components package to use the correct css import
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of files to fix
const filesToFix = [
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/Footer/Footer.js",
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/ViewerMixin.js",
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/DistanceGuide.js",
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/FigspecFileViewer.js",
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/Node.js",
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/InspectorView/InspectorView.js",
  "../node_modules/@figspec/components/esm/es2015/FigspecViewer/ErrorMessage.js",
];

let patchCount = 0;

// Process each file
filesToFix.forEach((relativeFilePath) => {
  const filePath = path.resolve(__dirname, relativeFilePath);

  try {
    // Read the file
    let content = fs.readFileSync(filePath, "utf8");

    // Replace the import with the correct one
    // We're looking for any import of css from our custom lit-css.js file or from lit
    const newContent = content
      .replace(
        /import\s*{\s*css\s*}\s*from\s*["'].*lit-css\.js["'];?/g,
        'import { css } from "@lit/reactive-element/css-tag.js";'
      )
      .replace(
        /import\s*{\s*css\s*}\s*from\s*["']lit\/static-html\.js["'];?/g,
        'import { css } from "@lit/reactive-element/css-tag.js";'
      )
      .replace(
        /import\s*{\s*css\s*}\s*from\s*["']lit["'];?/g,
        'import { css } from "@lit/reactive-element/css-tag.js";'
      )
      .replace(
        /import\s*{\s*css\s*}\s*from\s*["']lit\/css["'];?/g,
        'import { css } from "@lit/reactive-element/css-tag.js";'
      )
      .replace(
        /import\s*{\s*css\s*,([^}]+)}\s*from\s*["']lit["'];?/g,
        'import { css } from "@lit/reactive-element/css-tag.js";\nimport {$1} from "lit";'
      )
      .replace(
        /import\s*{\s*([^}]+),\s*css\s*}\s*from\s*["']lit["'];?/g,
        'import { css } from "@lit/reactive-element/css-tag.js";\nimport {$1} from "lit";'
      );

    // Write the file if it changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, "utf8");
      patchCount++;
      console.log(`Patched: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log(`Patched ${patchCount} files in @figspec/components package`);
