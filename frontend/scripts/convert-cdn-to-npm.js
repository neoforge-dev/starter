#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CDN to npm import mappings
const CDN_TO_NPM_MAPPINGS = [
  {
    pattern: /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](https:\/\/cdn\.jsdelivr\.net\/gh\/lit\/dist@3\/core\/lit-core\.min\.js)['"];?/g,
    replacement: "import $1 from 'lit';"
  },
  {
    pattern: /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](https:\/\/cdn\.jsdelivr\.net\/gh\/lit\/dist@3\/index\.js)['"];?/g,
    replacement: "import $1 from 'lit';"
  },
  {
    pattern: /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](https:\/\/cdn\.jsdelivr\.net\/npm\/lit@3\/index\.js)['"];?/g,
    replacement: "import $1 from 'lit';"
  },
  {
    pattern: /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](https:\/\/cdn\.jsdelivr\.net\/npm\/lit-html@3\/lit-html\.js)['"];?/g,
    replacement: "import $1 from 'lit-html';"
  },
  {
    pattern: /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](https:\/\/cdn\.jsdelivr\.net\/npm\/lit-element@4\/index\.js)['"];?/g,
    replacement: "import $1 from 'lit-element';"
  },
  {
    pattern: /import\s+({[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"](https:\/\/cdn\.jsdelivr\.net\/npm\/@lit\/reactive-element@1\/reactive-element\.js)['"];?/g,
    replacement: "import $1 from '@lit/reactive-element';"
  }
];

// Function to recursively find all .js files
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, coverage, and other build directories
      if (!['node_modules', 'dist', 'build', 'coverage', '.git'].includes(file)) {
        findJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to convert CDN imports to npm imports in a file
function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let conversions = [];

    CDN_TO_NPM_MAPPINGS.forEach(mapping => {
      const matches = content.match(mapping.pattern);
      if (matches) {
        matches.forEach(match => {
          conversions.push({
            from: match,
            to: match.replace(mapping.pattern, mapping.replacement)
          });
        });
        content = content.replace(mapping.pattern, mapping.replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Converted ${filePath}`);
      conversions.forEach(conv => {
        console.log(`   ${conv.from.trim()}`);
        console.log(`   → ${conv.to.trim()}`);
      });
    }

    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const jsFiles = findJsFiles(srcDir);

  console.log(`🔍 Found ${jsFiles.length} JavaScript files to check`);

  let convertedCount = 0;

  jsFiles.forEach(filePath => {
    const wasConverted = convertFile(filePath);
    if (wasConverted) {
      convertedCount++;
    }
  });

  console.log(`\n📊 Conversion Summary:`);
  console.log(`   Total files checked: ${jsFiles.length}`);
  console.log(`   Files converted: ${convertedCount}`);
  console.log(`   Files unchanged: ${jsFiles.length - convertedCount}`);

  if (convertedCount > 0) {
    console.log(`\n🎉 Successfully converted ${convertedCount} files from CDN to npm imports!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Run tests to verify no regressions: npm run test`);
    console.log(`   2. Build to verify imports work: npm run build`);
    console.log(`   3. Remove CDN aliases from vitest.config.js if all tests pass`);
  } else {
    console.log(`\n✨ No CDN imports found to convert.`);
  }
}

main().catch(console.error);
