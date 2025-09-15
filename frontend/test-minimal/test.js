// Simple test to verify neo-app component and routing
console.log("Starting NeoForge minimal test...");

// Test 1: Check if neo-app component is defined
function testNeoAppComponent() {
  const neoAppDefined = customElements.get('neo-app') !== undefined;
  console.log('✅ NeoApp component defined:', neoAppDefined);
  return neoAppDefined;
}

// Test 2: Check if neo-app element exists in DOM
function testNeoAppElement() {
  const neoAppElement = document.querySelector('neo-app') !== null;
  console.log('✅ NeoApp element exists in DOM:', neoAppElement);
  return neoAppElement;
}

// Test 3: Check if router outlet exists
function testRouterOutlet() {
  const routerOutlet = document.querySelector('#router-outlet') !== null;
  console.log('✅ Router outlet exists:', routerOutlet);
  return routerOutlet;
}

// Test 4: Test navigation to registration page
function testNavigation() {
  const registerLink = document.querySelector('a[href="/register"]');
  if (registerLink) {
    console.log('✅ Register link found, clicking...');
    registerLink.click();

    // Check if URL changed
    setTimeout(() => {
      const urlChanged = window.location.pathname === '/register';
      console.log('✅ URL changed to /register:', urlChanged);

      // Check if registration form elements exist
      setTimeout(() => {
        const nameInput = document.querySelector('[data-testid="name-input"]');
        const emailInput = document.querySelector('[data-testid="email-input"]');
        const passwordInput = document.querySelector('[data-testid="password-input"]');
        const confirmPasswordInput = document.querySelector('[data-testid="confirm-password-input"]');
        const registerButton = document.querySelector('[data-testid="register-button"]');

        console.log('✅ Name input found:', nameInput !== null);
        console.log('✅ Email input found:', emailInput !== null);
        console.log('✅ Password input found:', passwordInput !== null);
        console.log('✅ Confirm password input found:', confirmPasswordInput !== null);
        console.log('✅ Register button found:', registerButton !== null);

        const allElementsFound = nameInput && emailInput && passwordInput && confirmPasswordInput && registerButton;
        console.log('🎉 All registration form elements found:', allElementsFound);

        if (allElementsFound) {
          console.log('🎉 SUCCESS: NeoForge routing system is working!');
          console.log('🎉 E2E tests can now proceed with the registration page.');
        }
      }, 100);
    }, 100);
  } else {
    console.log('❌ Register link not found');
  }
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTests);
} else {
  runTests();
}

function runTests() {
  console.log('🔍 Running NeoForge minimal tests...');

  setTimeout(() => {
    const componentTest = testNeoAppComponent();
    const elementTest = testNeoAppElement();
    const outletTest = testRouterOutlet();

    if (componentTest && elementTest && outletTest) {
      console.log('✅ Basic setup tests passed, testing navigation...');
      testNavigation();
    } else {
      console.log('❌ Basic setup tests failed');
    }
  }, 500); // Wait for components to load
}