// Comprehensive verification script for NeoForge minimal test setup
// This script can be run in Node.js or browser to verify functionality

import { chromium } from 'playwright';

async function verifyMinimalSetup() {
  console.log('🔍 Starting comprehensive verification of NeoForge minimal setup...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the test page
    console.log('📄 Loading test page...');
    await page.goto('http://localhost:8081/');
    await page.waitForLoadState('networkidle');

    // Test 1: Check page title
    const title = await page.title();
    console.log(`📋 Page title: ${title}`);
    const titleCorrect = title === 'NeoForge Minimal Test';
    console.log(`✅ Title correct: ${titleCorrect}\n`);

    // Test 2: Check if neo-app component is defined
    const neoAppDefined = await page.evaluate(() => {
      return customElements.get('neo-app') !== undefined;
    });
    console.log(`🏗️  NeoApp component defined: ${neoAppDefined}`);

    // Test 3: Check if neo-app element exists in DOM
    const neoAppElement = await page.locator('neo-app');
    const neoAppExists = await neoAppElement.count() > 0;
    console.log(`🌐 NeoApp element exists: ${neoAppExists}`);

    // Test 4: Check if router outlet exists
    const routerOutlet = await page.locator('#router-outlet');
    const outletExists = await routerOutlet.count() > 0;
    console.log(`🔗 Router outlet exists: ${outletExists}`);

    // Test 5: Check initial content
    const initialContent = await page.textContent('#router-outlet');
    const hasWelcomeText = initialContent.includes('Welcome to NeoForge');
    console.log(`📝 Initial content loaded: ${hasWelcomeText}`);

    // Test 6: Check navigation link exists
    const registerLink = await page.locator('a[href="/register"]');
    const linkExists = await registerLink.count() > 0;
    console.log(`🔗 Register link exists: ${linkExists}`);

    // Test 7: Test navigation to registration page
    if (linkExists) {
      console.log('\n🧪 Testing navigation to /register...');
      await registerLink.click();
      await page.waitForURL('**/register');

      const currentURL = page.url();
      const urlCorrect = currentURL.includes('/register');
      console.log(`📍 URL changed to /register: ${urlCorrect}`);

      // Test 8: Check registration form elements
      const nameInput = await page.locator('[data-testid="name-input"]');
      const emailInput = await page.locator('[data-testid="email-input"]');
      const passwordInput = await page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = await page.locator('[data-testid="confirm-password-input"]');
      const registerButton = await page.locator('[data-testid="register-button"]');

      const nameExists = await nameInput.count() > 0;
      const emailExists = await emailInput.count() > 0;
      const passwordExists = await passwordInput.count() > 0;
      const confirmPasswordExists = await confirmPasswordInput.count() > 0;
      const buttonExists = await registerButton.count() > 0;

      console.log(`📝 Name input (data-testid="name-input"): ${nameExists}`);
      console.log(`📧 Email input (data-testid="email-input"): ${emailExists}`);
      console.log(`🔒 Password input (data-testid="password-input"): ${passwordExists}`);
      console.log(`🔒 Confirm password input (data-testid="confirm-password-input"): ${confirmPasswordExists}`);
      console.log(`🔘 Register button (data-testid="register-button"): ${buttonExists}`);

      const allFormElements = nameExists && emailExists && passwordExists && confirmPasswordExists && buttonExists;
      console.log(`📋 All registration form elements present: ${allFormElements}`);

      // Test 9: Check form content
      const formTitle = await page.textContent('h2');
      const titleCorrect2 = formTitle.includes('Registration Page');
      console.log(`📄 Registration page title correct: ${titleCorrect2}`);
    }

    // Test 10: Check console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Wait a bit for console messages
    await page.waitForTimeout(1000);

    const neoAppRegistered = consoleMessages.some(msg => msg.includes('NeoApp component registered successfully'));
    console.log(`📢 NeoApp registration message: ${neoAppRegistered}`);

    // Summary
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('='.repeat(50));

    const allTests = [
      { name: 'Page loads', result: titleCorrect },
      { name: 'NeoApp component defined', result: neoAppDefined },
      { name: 'NeoApp element exists', result: neoAppExists },
      { name: 'Router outlet exists', result: outletExists },
      { name: 'Initial content loaded', result: hasWelcomeText },
      { name: 'Register link exists', result: linkExists },
      { name: 'Navigation works', result: urlCorrect || false },
      { name: 'All form elements present', result: allFormElements || false },
      { name: 'NeoApp registration logged', result: neoAppRegistered }
    ];

    allTests.forEach(test => {
      const status = test.result ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
    });

    const passedTests = allTests.filter(test => test.result).length;
    const totalTests = allTests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed (${successRate}%)`);

    if (successRate === 100) {
      console.log('🎉 SUCCESS: NeoForge minimal setup is fully functional!');
      console.log('🚀 Ready to proceed with E2E testing.');
    } else if (successRate >= 80) {
      console.log('⚠️  PARTIAL SUCCESS: Most functionality working, minor issues to resolve.');
    } else {
      console.log('❌ FAILURE: Significant issues need to be addressed.');
    }

  } catch (error) {
    console.error('❌ Verification failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verifyMinimalSetup };
} else if (typeof window !== 'undefined') {
  window.verifyMinimalSetup = verifyMinimalSetup;
}

// Auto-run if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  verifyMinimalSetup().catch(console.error);
}