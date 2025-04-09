#!/usr/bin/env node

/**
 * This script patches the @figspec/components package to fix the lit css import issue
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all files in the @figspec/components package that import css from lit
const figspecDir = path.resolve(__dirname, '../node_modules/@figspec/components');
const files = glob.sync(`${figspecDir}/**/*.js`);

let patchCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Check if the file imports css from lit
  if (content.includes('import { css') || content.includes('import {css')) {
    // Replace the import with our custom import
    const newContent = content
      .replace(/import\s*{\s*css\s*,([^}]+)}\s*from\s*["']lit["']/g, 'import {$1} from "lit";\nimport { css } from "lit/css"')
      .replace(/import\s*{\s*([^}]+),\s*css\s*}\s*from\s*["']lit["']/g, 'import {$1} from "lit";\nimport { css } from "lit/css"')
      .replace(/import\s*{\s*css\s*}\s*from\s*["']lit["']/g, 'import { css } from "lit/css"')
      .replace(/import\s*{\s*css\s*}\s*from\s*["']lit\/css["']/g, 'import { css } from "lit/css"');
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      patchCount++;
      console.log(`Patched: ${path.relative(process.cwd(), file)}`);
    }
  }
});

console.log(`Patched ${patchCount} files in @figspec/components package`); 