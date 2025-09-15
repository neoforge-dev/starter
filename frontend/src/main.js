// Minimal NeoApp component for main application - VANILLA JAVASCRIPT VERSION
import { router } from './router.js';

class NeoApp extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="app" style="
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <header style="
          background: #f8f9fa;
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
        ">
          <a href="/" class="logo" style="
            margin: 0;
            color: #2563eb;
            text-decoration: none;
            font-size: 1.5rem;
            font-weight: bold;
          ">NeoForge</a>
        </header>
        <main id="router-outlet" style="
          flex: 1;
          padding: 1rem;
        ">
          <div style="text-align: center; padding: 2rem;">
            <h2>Welcome to NeoForge</h2>
            <p>The router outlet is ready!</p>
            <p><a href="/register">Go to Registration</a></p>
          </div>
        </main>
        <footer style="
          background: #f8f9fa;
          padding: 1rem;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #6c757d;
        ">
          <p>&copy; 2024 NeoForge</p>
        </footer>
      </div>
    `;

    // Initialize router after component is rendered
    setTimeout(() => {
      if (router && typeof router.initialize === 'function') {
        router.initialize();
      }
    }, 100);
  }
}

customElements.define("neo-app", NeoApp);
console.log("NeoApp component registered successfully");

// Add a global function to check component status
window.checkNeoAppStatus = function() {
  console.log("Checking NeoApp status...");
  const neoApp = document.querySelector('neo-app');
  console.log("NeoApp element:", neoApp);
  console.log("Custom element defined:", customElements.get('neo-app') !== undefined);
  if (neoApp) {
    const routerOutlet = neoApp.querySelector('#router-outlet');
    console.log("Router outlet:", routerOutlet);
    console.log("Router outlet content:", routerOutlet ? routerOutlet.innerHTML : 'N/A');
  }
};
