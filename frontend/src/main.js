import { pwaService } from "./services/pwa.js";
import "./router.js";
import "./components/header.js";
import "./components/footer.js";
import "./components/core/pwa-prompt.js";
import { baseStyles } from "./components/styles/base.js";
import { LitElement, html } from "lit";

// Keep only the NeoApp shell and delegate routing to frontend/src/router.js
class NeoApp extends LitElement {
  static styles = [baseStyles];
  static properties = {
    pageContent: { type: Object },
  };

  constructor() {
    super();
    this.pageContent = null;
  }

  render() {
    return html`
      <div class="app">
        <app-header></app-header>
        <main id="router-outlet">
          ${this.pageContent ? this.pageContent : html`<slot></slot>`}
        </main>
        <app-footer></app-footer>
        <pwa-prompt></pwa-prompt>
      </div>
    `;
  }
}

customElements.define("neo-app", NeoApp);

// Initialize theme
const savedTheme = localStorage.getItem("neo-theme") || "system";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
const initialTheme = savedTheme === "system" ? systemTheme : savedTheme;
document.documentElement.setAttribute("data-theme", initialTheme);

// Initialize PWA service
pwaService.initialize();
pwaService.enablePeriodicUpdates(60);
