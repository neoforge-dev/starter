#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

const MIGRATIONS = {
  imports: {
    "@open-wc/testing": "vitest",
    chai: "vitest",
    "@web/test-runner": "vitest",
    "@web/test-runner-visual-regression": "@playwright/test",
    "@web/test-runner-commands": "@playwright/test",
  },
  assertions: {
    "expect(.*).to.equal": "expect$1.toBe",
    "expect(.*).to.be.true": "expect$1.toBe(true)",
    "expect(.*).to.be.false": "expect$1.toBe(false)",
    "expect(.*).to.exist": "expect$1.toBeDefined()",
  },
  visualTests: {
    "compareScreenshot\\((.*)\\)":
      "expect(await page.screenshot()).toMatchSnapshot($1)",
    "setViewport\\((.*)\\)": "page.setViewportSize($1)",
  },
  a11yTests: {
    "checkA11y\\((.*)\\)": "await checkA11y(page, $1)",
    "violationFinder\\((.*)\\)":
      "await checkA11y(page, $1, { includedImpacts: ['critical', 'serious'] })",
  },
};

const TEMPLATE_VISUAL = `
import { test, expect } from '@playwright/test';

test.describe('Visual regression tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('component renders correctly', async ({ page }) => {
    await expect(page.locator('neo-button')).toBeVisible();
    await expect(page).toHaveScreenshot();
  });
});`;

const TEMPLATE_A11Y = `
import { test, expect } from '@playwright/test';
import { checkA11y, injectAxe } from '@axe-core/playwright';

test.describe('Accessibility tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('page meets accessibility standards', async ({ page }) => {
    await checkA11y(page);
  });
});`;

async function migrateFile(filePath, type = "component") {
  let content = await readFile(filePath, "utf-8");

  // Update imports
  for (const [oldImport, newImport] of Object.entries(MIGRATIONS.imports)) {
    content = content.replace(
      new RegExp(`import .* from ['"]${oldImport}['"]`),
      `import { expect, test, describe, beforeEach, afterEach } from '${newImport}'`
    );
  }

  // Update assertions
  for (const [oldPattern, newPattern] of Object.entries(
    MIGRATIONS.assertions
  )) {
    content = content.replace(new RegExp(oldPattern, "g"), newPattern);
  }

  if (type === "visual") {
    for (const [oldPattern, newPattern] of Object.entries(
      MIGRATIONS.visualTests
    )) {
      content = content.replace(new RegExp(oldPattern, "g"), newPattern);
    }
  }

  if (type === "a11y") {
    for (const [oldPattern, newPattern] of Object.entries(
      MIGRATIONS.a11yTests
    )) {
      content = content.replace(new RegExp(oldPattern, "g"), newPattern);
    }
  }

  // Update test structure
  content = content.replace(/it\(/g, "test(");

  await writeFile(filePath, content);
  console.log(`Migrated ${filePath}`);
}

async function createTemplateIfNeeded(dir, filename, template) {
  const path = join(dir, filename);
  try {
    await readFile(path);
  } catch {
    await writeFile(path, template);
    console.log(`Created template ${path}`);
  }
}

async function* walkDir(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const path = join(dir, file.name);
    if (file.isDirectory()) {
      yield* walkDir(path);
    } else if (file.name.match(/\.(test|spec)\.js$/)) {
      yield path;
    }
  }
}

async function migrateTests() {
  const testDir = join(ROOT_DIR, "src/test");

  // Ensure directories exist
  await mkdir(join(testDir, "visual"), { recursive: true });
  await mkdir(join(testDir, "accessibility"), { recursive: true });

  // Create template files if needed
  await createTemplateIfNeeded(
    join(testDir, "visual"),
    "basic.test.js",
    TEMPLATE_VISUAL
  );
  await createTemplateIfNeeded(
    join(testDir, "accessibility"),
    "basic.test.js",
    TEMPLATE_A11Y
  );

  for await (const filePath of walkDir(testDir)) {
    if (filePath.includes("components/")) {
      await migrateFile(filePath, "component");
    } else if (filePath.includes("visual/")) {
      await migrateFile(filePath, "visual");
    } else if (filePath.includes("accessibility/")) {
      await migrateFile(filePath, "a11y");
    }
  }
}

migrateTests().catch(console.error);
