import { test, expect } from '@playwright/test';

test('debug component dependencies', async ({ page }) => {
  // Load the debug HTML file
  await page.goto('http://localhost:3000/debug-dependencies.html');
  await page.waitForLoadState('networkidle');

  // Wait for debug output to appear
  await page.waitForSelector('#output', { timeout: 10000 });

  // Get all debug messages
  const debugMessages = await page.locator('#output div').allTextContents();

  console.log('Debug messages:');
  debugMessages.forEach((msg, index) => {
    console.log(`${index + 1}: ${msg}`);
  });

  // Check if test component was created
  const testComponent = page.locator('test-component');
  const componentExists = await testComponent.count() > 0;

  console.log('Test component exists:', componentExists);

  if (componentExists) {
    await expect(testComponent).toContainText('Test Component Loaded Successfully');
    console.log('✅ Basic component dependencies are working');
  } else {
    console.log('❌ Component dependencies have issues');
  }

  // Check for any JavaScript errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  if (errors.length > 0) {
    console.log('JavaScript errors found:', errors);
  }
});