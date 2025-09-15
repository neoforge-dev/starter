// Simplified main.js for debugging
import { LitElement, html, css } from "lit";
import "./router-simple.js";

// Simple neo-app component
class NeoApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    main {
      flex: 1;
      padding: 1rem;
    }
    header {
      background: #f8f9fa;
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
    }
    .logo {
      margin: 0;
      color: #2563eb;
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: bold;
    }
    footer {
      background: #f8f9fa;
      padding: 1rem;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #6c757d;
    }
  `;

  render() {
    return html`
      <div class="app">
        <header>
          <a href="/" class="logo">NeoForge</a>
        </header>
        <main id="router-outlet">
          <div style="text-align: center; padding: 2rem;">
            <h2>Welcome to NeoForge</h2>
            <p>The router outlet is ready!</p>
            <p><a href="/register">Go to Registration</a></p>
          </div>
        </main>
        <footer>
          <p>&copy; 2024 NeoForge</p>
        </footer>
      </div>
    `;
  }
}

customElements.define("neo-app", NeoApp);
console.log("NeoApp component defined successfully");