// Simple test script to verify minimal setup
// Run with: node simple-test.js

import { chromium } from 'playwright';

async function runSimpleTest() {
  console.log('🔍 Running simple verification test for NeoForge minimal setup...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the test page
    console.log('📄 Loading test page...');
    await page.goto('http://localhost:8082/');
    await page.waitForLoadState('networkidle');

    // Basic checks
    const title = await page.title();
    console.log(`📋 Page title: ${title}`);

    const neoAppDefined = await page.evaluate(() => {
      return customElements.get('neo-app') !== undefined;
    });
    console.log(`🏗️  NeoApp component defined: ${neoAppDefined}`);

    const neoAppElement = await page.locator('neo-app').count() > 0;
    console.log(`🌐 NeoApp element exists: ${neoAppElement}`);

    const routerOutlet = await page.locator('#router-outlet').count() > 0;
    console.log(`🔗 Router outlet exists: ${routerOutlet}`);

    // Test navigation
    const registerLink = await page.locator('a[href="/register"]').count() > 0;
    console.log(`🔗 Register link exists: ${registerLink}`);

    if (registerLink) {
      console.log('\n🧪 Testing navigation...');
      await page.locator('a[href="/register"]').click();
      await page.waitForURL('**/register');

      const url = page.url();
      console.log(`📍 URL after navigation: ${url}`);

      const onRegisterPage = url.includes('/register');
      console.log(`✅ Navigation successful: ${onRegisterPage}`);

      if (onRegisterPage) {
        // Check form elements
        const nameInput = await page.locator('[data-testid="name-input"]').count() > 0;
        const emailInput = await page.locator('[data-testid="email-input"]').count() > 0;
        const passwordInput = await page.locator('[data-testid="password-input"]').count() > 0;
        const confirmInput = await page.locator('[data-testid="confirm-password-input"]').count() > 0;
        const registerBtn = await page.locator('[data-testid="register-button"]').count() > 0;

        console.log(`📝 Form elements found:`);
        console.log(`   - Name input: ${nameInput}`);
        console.log(`   - Email input: ${emailInput}`);
        console.log(`   - Password input: ${passwordInput}`);
        console.log(`   - Confirm password input: ${confirmInput}`);
        console.log(`   - Register button: ${registerBtn}`);

        const allElements = nameInput && emailInput && passwordInput && confirmInput && registerBtn;
        console.log(`✅ All form elements present: ${allElements}`);
      }
    }

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('='.repeat(40));

    const tests = [
      { name: 'Page loads', result: title === 'NeoForge Minimal Test' },
      { name: 'NeoApp defined', result: neoAppDefined },
      { name: 'NeoApp element', result: neoAppElement },
      { name: 'Router outlet', result: routerOutlet },
      { name: 'Register link', result: registerLink },
      { name: 'Navigation works', result: url && url.includes('/register') },
      { name: 'Form elements', result: nameInput && emailInput && passwordInput && confirmInput && registerBtn }
    ];

    tests.forEach(test => {
      const status = test.result ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
    });

    const passed = tests.filter(t => t.result).length;
    const total = tests.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`\n🎯 RESULT: ${passed}/${total} tests passed (${percentage}%)`);

    if (percentage === 100) {
      console.log('🎉 SUCCESS: Minimal setup is fully functional!');
      console.log('🚀 Ready to proceed with E2E testing.');
    } else if (percentage >= 70) {
      console.log('⚠️  MOSTLY WORKING: Core functionality is ready.');
    } else {
      console.log('❌ ISSUES FOUND: Need to debug further.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
runSimpleTest().catch(console.error);