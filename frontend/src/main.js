import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "./components/styles/base.js";
import { lazyLoad } from "./utils/lazy-load.js";
import registrationPromise from "./register-components.mjs";

// Import critical components
import "./components/header.js";
import "./components/footer.js";

// Configure logging
const isDev = import.meta.env.DEV;
console.log(`Running in ${isDev ? "development" : "production"} mode`);

// Route definitions with lazy loading
const routes = {
  "/": {
    component: "landing-page",
    import: () => import("./pages/landing-page.js"),
  },
  "/docs": {
    component: "docs-page",
    import: () => import("./pages/docs-page.js"),
  },
  "/examples": {
    component: "examples-page",
    import: () => import("./pages/examples-page.js"),
  },
  "/dashboard": {
    component: "dashboard-page",
    import: () => import("./pages/dashboard-page.js"),
  },
  "/support": {
    component: "support-page",
    import: () => import("./pages/support-page.js"),
  },
  "/contact": {
    component: "contact-page",
    import: () => import("./pages/contact-page.js"),
  },
  "/profile": {
    component: "profile-page",
    import: () => import("./pages/profile-page.js"),
  },
  "/about": {
    component: "about-page",
    import: () => import("./pages/about-page.js"),
  },
  "/faq": {
    component: "faq-page",
    import: () => import("./pages/faq-page.js"),
  },
};

// Simple router
const router = {
  init() {
    window.addEventListener("popstate", () => this.handleRoute());
    window.addEventListener("DOMContentLoaded", () => this.handleRoute());
  },

  async handleRoute() {
    const app = document.querySelector("neo-app");
    if (!app) {
      console.error("neo-app element not found.");
      return;
    }

    const path = window.location.pathname;
    const route = routes[path];

    if (route) {
      try {
        // Show loading state
        app.pageContent = html`
          <div
            style="display: flex; justify-content: center; align-items: center; padding: 2rem;"
          >
            <div class="loading-spinner"></div>
          </div>
        `;

        // Wait for component registration
        await registrationPromise;

        // Load component if not already loaded
        if (!customElements.get(route.component)) {
          await route.import();
        }

        // Render component
        app.pageContent = html`<${route.component}></${route.component}>`;
      } catch (error) {
        console.error("Error loading page:", error);
        app.pageContent = html`
          <div style="text-align: center; padding: 4rem 2rem;">
            <h1>Error Loading Page</h1>
            <p>Sorry, something went wrong. Please try again.</p>
            <a
              href="/"
              style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; text-decoration: none; border-radius: 4px;"
              >Return Home</a
            >
          </div>
        `;
      }
    } else {
      app.pageContent = html`
        <div style="text-align: center; padding: 4rem 2rem;">
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a
            href="/"
            style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; text-decoration: none; border-radius: 4px;"
            >Return Home</a
          >
        </div>
      `;
    }
  },
};

// Initialize router
router.init();

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
