import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find all story files
const storyFiles = await glob("src/**/*.stories.js", {
  cwd: path.resolve(__dirname, ".."),
});

console.log(`Found ${storyFiles.length} story files to process`);

let fixedFiles = 0;

for (const file of storyFiles) {
  const filePath = path.resolve(__dirname, "..", file);
  let content = fs.readFileSync(filePath, "utf8");

  // Check if the file contains escaped backticks
  if (content.includes("html\\`")) {
    // Replace escaped backticks with regular backticks
    const originalContent = content;
    content = content.replace(/html\\\`/g, "html`");
    content = content.replace(/\\\`/g, "`");

    // Save the fixed file
    fs.writeFileSync(filePath, content, "utf8");

    // Also save a backup of the original file
    fs.writeFileSync(`${filePath}.bak`, originalContent, "utf8");

    fixedFiles++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`Fixed ${fixedFiles} files with escaped backticks`);
