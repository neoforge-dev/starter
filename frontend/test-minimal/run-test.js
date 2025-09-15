#!/usr/bin/env node

// Simple test runner for minimal NeoForge setup
// Run with: node run-test.js

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:8084/';

async function runTests() {
  console.log('🚀 Starting NeoForge Minimal Setup E2E Tests...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, details = '') {
    results.total++;
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}`);
    if (details) console.log(`   ${details}`);

    results.tests.push({ name, passed, details });
  }

  try {
    // Test 1: Page loads
    console.log('📄 Test 1: Page loads...');
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    const titleCorrect = title === 'NeoForge Minimal Test';
    logTest('Page loads correctly', titleCorrect, `Title: "${title}"`);

    // Test 2: NeoApp component exists
    console.log('🏗️  Test 2: NeoApp component...');
    const neoAppElement = await page.locator('neo-app').count() > 0;
    logTest('NeoApp element exists', neoAppElement);

    // Test 3: Router outlet exists
    console.log('🔗 Test 3: Router outlet...');
    const routerOutlet = await page.locator('#router-outlet').count() > 0;
    logTest('Router outlet exists', routerOutlet);

    // Test 4: Initial content
    console.log('📝 Test 4: Initial content...');
    const initialContent = await page.textContent('#router-outlet');
    const hasWelcome = initialContent.includes('Welcome to NeoForge');
    logTest('Initial content loads', hasWelcome, `Content: "${initialContent.substring(0, 50)}..."`);

    // Test 5: Register link exists
    console.log('🔗 Test 5: Register link...');
    const registerLink = await page.locator('a[href="/register"]').count() > 0;
    logTest('Register link exists', registerLink);

    if (registerLink) {
      // Test 6: Navigation works
      console.log('🧪 Test 6: Navigation...');
      await page.locator('a[href="/register"]').click();
      await page.waitForURL('**/register');

      const currentURL = page.url();
      const navigationWorked = currentURL.includes('/register');
      logTest('Navigation to /register', navigationWorked, `URL: ${currentURL}`);

      if (navigationWorked) {
        // Test 7: Registration page title
        console.log('📄 Test 7: Registration page...');
        const pageTitle = await page.locator('h2').textContent();
        const titleCorrect = pageTitle.includes('Registration Page');
        logTest('Registration page title', titleCorrect, `Title: "${pageTitle}"`);

        // Test 8: Form elements exist
        console.log('📝 Test 8: Form elements...');
        const nameInput = await page.locator('[data-testid="name-input"]').count() > 0;
        const emailInput = await page.locator('[data-testid="email-input"]').count() > 0;
        const passwordInput = await page.locator('[data-testid="password-input"]').count() > 0;
        const confirmInput = await page.locator('[data-testid="confirm-password-input"]').count() > 0;
        const registerBtn = await page.locator('[data-testid="register-button"]').count() > 0;

        logTest('Name input exists', nameInput);
        logTest('Email input exists', emailInput);
        logTest('Password input exists', passwordInput);
        logTest('Confirm password input exists', confirmInput);
        logTest('Register button exists', registerBtn);

        const allFormElements = nameInput && emailInput && passwordInput && confirmInput && registerBtn;
        logTest('All form elements present', allFormElements);

        // Test 9: Form element attributes
        if (allFormElements) {
          console.log('🔧 Test 9: Form attributes...');
          const nameType = await page.locator('[data-testid="name-input"]').getAttribute('type');
          const emailType = await page.locator('[data-testid="email-input"]').getAttribute('type');
          const passwordType = await page.locator('[data-testid="password-input"]').getAttribute('type');
          const confirmType = await page.locator('[data-testid="confirm-password-input"]').getAttribute('type');
          const buttonType = await page.locator('[data-testid="register-button"]').getAttribute('type');

          logTest('Name input type', nameType === 'text', `Type: ${nameType}`);
          logTest('Email input type', emailType === 'email', `Type: ${emailType}`);
          logTest('Password input type', passwordType === 'password', `Type: ${passwordType}`);
          logTest('Confirm password type', confirmType === 'password', `Type: ${confirmType}`);
          logTest('Button type', buttonType === 'submit', `Type: ${buttonType}`);
        }
      }
    }

    // Test 10: 404 handling
    console.log('🚫 Test 10: 404 handling...');
    await page.goto(`${TEST_URL}nonexistent-page`);
    await page.waitForLoadState('networkidle');

    const notFoundContent = await page.textContent('#router-outlet');
    const has404 = notFoundContent.includes('Page Not Found');
    logTest('404 page handling', has404, `Content: "${notFoundContent.substring(0, 50)}..."`);

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    logTest('Test execution', false, `Error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ NeoForge minimal setup is fully functional');
    console.log('🚀 Ready to proceed with E2E testing infrastructure');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('❌ Issues need to be addressed before proceeding');

    console.log('\nFailed Tests:');
    results.tests.filter(test => !test.passed).forEach(test => {
      console.log(`❌ ${test.name}: ${test.details}`);
    });
  }

  return results.failed === 0;
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});