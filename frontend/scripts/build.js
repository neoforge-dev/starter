import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcDir = resolve(__dirname, "../src");

const replaceImports = (content) => {
  return content.replace(
    /import\s*{([^}]+)}\s*from\s*['"]lit['"];?/g,
    'import { $1 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";'
  );
};

const processDirectory = (dir) => {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.name.endsWith(".js")) {
      const content = readFileSync(fullPath, "utf-8");
      const processedContent = replaceImports(content);
      writeFileSync(fullPath, processedContent);
    }
  }
};

console.log("Replacing development imports with CDN imports...");
processDirectory(srcDir);
console.log("Done!");
