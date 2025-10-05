#!/usr/bin/env node
/**
 * Script to automatically replace console statements with Logger utility
 * Excludes test files, stories, examples, and playground files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_SRC = path.join(__dirname, '..', 'src');

// Files to exclude from processing
const EXCLUDED_PATTERNS = [
  /\/test\//,
  /\/tests\//,
  /\.test\.js$/,
  /\.spec\.js$/,
  /\/examples\//,
  /\.stories\.js$/,
  /\/playground\//,
  /\/docs\//,
  /\.md$/,
  /logger\.js$/,
  /example.*\.html$/,
];

// Patterns to replace
const REPLACEMENTS = [
  {
    pattern: /console\.log\(/g,
    replacement: 'Logger.info(',
    type: 'log'
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'Logger.info(',
    type: 'info'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'Logger.warn(',
    type: 'warn'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'Logger.error(',
    type: 'error'
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'Logger.debug(',
    type: 'debug'
  },
];

async function getAllJsFiles(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await getAllJsFiles(filePath, fileList);
    } else if (file.name.endsWith('.js')) {
      // Check if file should be excluded
      const shouldExclude = EXCLUDED_PATTERNS.some(pattern => pattern.test(filePath));
      if (!shouldExclude) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

async function hasLoggerImport(content) {
  return content.includes("import { Logger } from") ||
         content.includes("import {Logger} from");
}

async function addLoggerImport(content, filePath) {
  // Determine the relative path to logger.js
  const fileDir = path.dirname(filePath);
  const loggerPath = path.join(FRONTEND_SRC, 'utils', 'logger.js');
  let relativePath = path.relative(fileDir, loggerPath);

  // Ensure it starts with ./
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Convert Windows paths to Unix paths
  relativePath = relativePath.replace(/\\/g, '/');

  // Find the last import statement
  const importRegex = /^import .+ from .+;$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    // Add after last import
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;

    return content.slice(0, insertPosition) +
           `\nimport { Logger } from '${relativePath}';` +
           content.slice(insertPosition);
  } else {
    // Add at the beginning if no imports found
    return `import { Logger } from '${relativePath}';\n\n` + content;
  }
}

async function processFile(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  let modified = false;
  const replacementCounts = {};

  // Check if file has any console statements
  const hasConsole = /console\.(log|info|warn|error|debug)\(/.test(content);
  if (!hasConsole) {
    return { modified: false, counts: {} };
  }

  // Apply replacements
  for (const { pattern, replacement, type } of REPLACEMENTS) {
    const beforeCount = (content.match(pattern) || []).length;
    if (beforeCount > 0) {
      content = content.replace(pattern, replacement);
      replacementCounts[type] = beforeCount;
      modified = true;
    }
  }

  // Add Logger import if needed and file was modified
  if (modified && !(await hasLoggerImport(content))) {
    content = await addLoggerImport(content, filePath);
  }

  if (modified) {
    await fs.writeFile(filePath, content, 'utf8');
  }

  return { modified, counts: replacementCounts };
}

async function main() {
  console.log('Starting console statement replacement...\n');
  console.log('Scanning for production JavaScript files...');

  const files = await getAllJsFiles(FRONTEND_SRC);
  console.log(`Found ${files.length} production files to process\n`);

  const stats = {
    totalFiles: files.length,
    modifiedFiles: 0,
    totalReplacements: {
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    },
    topFiles: [],
  };

  for (const file of files) {
    const result = await processFile(file);

    if (result.modified) {
      stats.modifiedFiles++;
      const relativePath = path.relative(FRONTEND_SRC, file);
      const totalFileReplacements = Object.values(result.counts).reduce((a, b) => a + b, 0);

      stats.topFiles.push({
        path: relativePath,
        count: totalFileReplacements,
        breakdown: result.counts,
      });

      // Update totals
      for (const [type, count] of Object.entries(result.counts)) {
        stats.totalReplacements[type] += count;
      }
    }
  }

  // Sort top files by replacement count
  stats.topFiles.sort((a, b) => b.count - a.count);

  // Print report
  console.log('='.repeat(80));
  console.log('CONSOLE STATEMENT REPLACEMENT REPORT');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total files scanned: ${stats.totalFiles}`);
  console.log(`Files modified: ${stats.modifiedFiles}`);
  console.log();
  console.log('Replacement Breakdown:');
  console.log(`  console.log   → Logger.info  : ${stats.totalReplacements.log} replacements`);
  console.log(`  console.info  → Logger.info  : ${stats.totalReplacements.info} replacements`);
  console.log(`  console.warn  → Logger.warn  : ${stats.totalReplacements.warn} replacements`);
  console.log(`  console.error → Logger.error : ${stats.totalReplacements.error} replacements`);
  console.log(`  console.debug → Logger.debug : ${stats.totalReplacements.debug} replacements`);
  console.log();

  const totalReplacements = Object.values(stats.totalReplacements).reduce((a, b) => a + b, 0);
  console.log(`TOTAL REPLACEMENTS: ${totalReplacements}`);
  console.log();

  if (stats.topFiles.length > 0) {
    console.log('Top 20 Modified Files:');
    console.log('-'.repeat(80));
    stats.topFiles.slice(0, 20).forEach((file, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${file.path}`);
      console.log(`    Total: ${file.count} | Details: ${JSON.stringify(file.breakdown)}`);
    });
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✅ Console statement replacement complete!');
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Error during processing:', error);
  process.exit(1);
});
