// Manual verification script for NeoForge minimal setup
// This script can be run in browser console or Node.js

console.log('🔍 NeoForge Minimal Setup Manual Verification');
console.log('==============================================');

// Test 1: Check if we're on the right page
function testPageLoad() {
  const title = document.title;
  const isCorrectPage = title === 'NeoForge Minimal Test';
  console.log(`📄 Page Title: "${title}" - ${isCorrectPage ? '✅' : '❌'}`);
  return isCorrectPage;
}

// Test 2: Check if neo-app component is defined
function testNeoAppComponent() {
  const neoAppDefined = customElements.get('neo-app') !== undefined;
  console.log(`🏗️  NeoApp Component Defined: ${neoAppDefined ? '✅' : '❌'}`);
  return neoAppDefined;
}

// Test 3: Check if neo-app element exists
function testNeoAppElement() {
  const neoAppElement = document.querySelector('neo-app');
  const exists = neoAppElement !== null;
  console.log(`🌐 NeoApp Element Exists: ${exists ? '✅' : '❌'}`);
  if (exists) {
    console.log(`   Element: ${neoAppElement.tagName}`);
  }
  return exists;
}

// Test 4: Check if router outlet exists
function testRouterOutlet() {
  const routerOutlet = document.querySelector('#router-outlet');
  const exists = routerOutlet !== null;
  console.log(`🔗 Router Outlet Exists: ${exists ? '✅' : '❌'}`);
  if (exists) {
    console.log(`   Outlet ID: ${routerOutlet.id}`);
    console.log(`   Content: "${routerOutlet.textContent.substring(0, 50)}..."`);
  }
  return exists;
}

// Test 5: Check initial content
function testInitialContent() {
  const outlet = document.querySelector('#router-outlet');
  if (!outlet) {
    console.log('📝 Initial Content: ❌ (no outlet found)');
    return false;
  }

  const content = outlet.textContent;
  const hasWelcome = content.includes('Welcome to NeoForge');
  const hasRouterReady = content.includes('router outlet is ready');
  console.log(`📝 Initial Content: ${hasWelcome && hasRouterReady ? '✅' : '❌'}`);
  console.log(`   Has welcome text: ${hasWelcome}`);
  console.log(`   Has router ready text: ${hasRouterReady}`);
  return hasWelcome && hasRouterReady;
}

// Test 6: Check navigation link
function testNavigationLink() {
  const registerLink = document.querySelector('a[href="/register"]');
  const exists = registerLink !== null;
  console.log(`🔗 Register Link Exists: ${exists ? '✅' : '❌'}`);
  if (exists) {
    console.log(`   Link text: "${registerLink.textContent}"`);
    console.log(`   Link href: "${registerLink.href}"`);
  }
  return exists;
}

// Test 7: Simulate navigation (manual test)
function testNavigation() {
  const registerLink = document.querySelector('a[href="/register"]');
  if (!registerLink) {
    console.log('🧪 Navigation Test: ❌ (no register link)');
    return false;
  }

  console.log('🧪 Navigation Test: Click register link...');
  registerLink.click();

  // Wait a bit for navigation
  setTimeout(() => {
    const currentPath = window.location.pathname;
    const navigationWorked = currentPath === '/register';
    console.log(`   Current path: ${currentPath}`);
    console.log(`   Navigation successful: ${navigationWorked ? '✅' : '❌'}`);

    if (navigationWorked) {
      // Check if registration form appeared
      setTimeout(() => {
        const formElements = {
          nameInput: document.querySelector('[data-testid="name-input"]'),
          emailInput: document.querySelector('[data-testid="email-input"]'),
          passwordInput: document.querySelector('[data-testid="password-input"]'),
          confirmInput: document.querySelector('[data-testid="confirm-password-input"]'),
          registerBtn: document.querySelector('[data-testid="register-button"]')
        };

        console.log('📝 Form Elements Check:');
        Object.entries(formElements).forEach(([name, element]) => {
          const exists = element !== null;
          console.log(`   ${name}: ${exists ? '✅' : '❌'}`);
        });

        const allExist = Object.values(formElements).every(el => el !== null);
        console.log(`   All form elements present: ${allExist ? '✅' : '❌'}`);

        if (allExist) {
          console.log('🎉 SUCCESS: Registration form loaded with all data-testid attributes!');
          console.log('🚀 E2E tests can now target these elements reliably.');
        }
      }, 100);
    }
  }, 100);

  return true; // Test initiated
}

// Test 8: Check component structure
function testComponentStructure() {
  const neoApp = document.querySelector('neo-app');
  if (!neoApp) {
    console.log('🏗️  Component Structure: ❌ (no neo-app element)');
    return false;
  }

  const shadowRoot = neoApp.shadowRoot;
  const hasShadowRoot = shadowRoot !== null;
  console.log(`🏗️  Component Shadow Root: ${hasShadowRoot ? '✅' : '❌'}`);

  if (hasShadowRoot) {
    const header = shadowRoot.querySelector('header');
    const main = shadowRoot.querySelector('main');
    const footer = shadowRoot.querySelector('footer');

    console.log(`   Header exists: ${header !== null ? '✅' : '❌'}`);
    console.log(`   Main exists: ${main !== null ? '✅' : '❌'}`);
    console.log(`   Footer exists: ${footer !== null ? '✅' : '❌'}`);

    if (main) {
      console.log(`   Main has router-outlet ID: ${main.id === 'router-outlet' ? '✅' : '❌'}`);
    }
  }

  return hasShadowRoot;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all verification tests...\n');

  const results = [];

  // Run tests with delays to ensure DOM is ready
  setTimeout(() => {
    results.push(testPageLoad());
    setTimeout(() => {
      results.push(testNeoAppComponent());
      setTimeout(() => {
        results.push(testNeoAppElement());
        setTimeout(() => {
          results.push(testRouterOutlet());
          setTimeout(() => {
            results.push(testInitialContent());
            setTimeout(() => {
              results.push(testNavigationLink());
              setTimeout(() => {
                results.push(testComponentStructure());
                setTimeout(() => {
                  testNavigation(); // This is async and will report separately

                  // Summary
                  setTimeout(() => {
                    const passed = results.filter(r => r).length;
                    const total = results.length;
                    const successRate = Math.round((passed / total) * 100);

                    console.log('\n📊 VERIFICATION SUMMARY');
                    console.log('='.repeat(40));
                    console.log(`Tests Passed: ${passed}/${total} (${successRate}%)`);

                    if (successRate === 100) {
                      console.log('🎉 ALL CORE TESTS PASSED!');
                      console.log('✅ NeoForge minimal setup is functional');
                      console.log('🔗 Ready for E2E testing');
                    } else if (successRate >= 80) {
                      console.log('⚠️  MOSTLY WORKING');
                      console.log('🔧 Minor issues may need attention');
                    } else {
                      console.log('❌ SIGNIFICANT ISSUES');
                      console.log('🔧 Core functionality needs debugging');
                    }

                    console.log('\n💡 MANUAL NAVIGATION TEST:');
                    console.log('1. Click the "Go to Registration" link');
                    console.log('2. Verify URL changes to /register');
                    console.log('3. Check that registration form appears');
                    console.log('4. Verify all form inputs have data-testid attributes');

                  }, 500);
                }, 100);
              }, 100);
            }, 100);
          }, 100);
        }, 100);
      }, 100);
    }, 100);
  }, 500);
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
  // Browser environment
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
} else {
  // Node.js environment
  console.log('📋 Manual verification script loaded');
  console.log('💡 Run runAllTests() in browser console to execute tests');
}

// Export for manual execution
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.testPageLoad = testPageLoad;
  window.testNeoAppComponent = testNeoAppComponent;
  window.testNeoAppElement = testNeoAppElement;
  window.testRouterOutlet = testRouterOutlet;
  window.testInitialContent = testInitialContent;
  window.testNavigationLink = testNavigationLink;
  window.testNavigation = testNavigation;
  window.testComponentStructure = testComponentStructure;
}