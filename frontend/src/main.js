import { Logger } from "./utils/logger.js";
import { LitElement, html } from "/vendor/lit-core.min.js";
import { baseStyles } from "./styles/base.js";
import "./components/core/app-header.js";
import "./components/core/app-footer.js";

// Import components
import "./components/core/app-shell.js";
import "./pages/landing-page.js";
import "./pages/home-page.js";
import "./pages/support-page.js";
import "./pages/docs-page.js";

// Configure logging based on environment
if (import.meta.env.PROD) {
  window.LOG_LEVEL = "warn"; // Only show warnings and errors in production
} else {
  window.LOG_LEVEL = "debug"; // Show all logs in development
}

Logger.info("Initializing app...");

// Wait for custom elements to be defined
async function waitForCustomElements() {
  Logger.debug("Waiting for custom elements...");
  if (customElements.get("app-shell")) {
    Logger.debug("Custom elements already defined");
    return;
  }
  await new Promise((resolve) => {
    const check = () => {
      if (customElements.get("app-shell")) {
        Logger.debug("Custom elements now defined");
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

// Initialize service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register("/src/service-worker.js")
        .then((registration) => {
          Logger.info("ServiceWorker registration successful", registration);
        })
        .catch((err) => {
          Logger.error("ServiceWorker registration failed:", err);
        });
    } else {
      console.log("Development mode: skipping service worker registration");
    }
  });
}

// Simple router
const router = {
  init() {
    window.addEventListener("popstate", () => this.handleRoute());
    window.addEventListener("DOMContentLoaded", () => this.handleRoute());
  },

  handleRoute() {
    const app = document.querySelector("neo-app");
    if (!app) {
      console.error("neo-app element not found.");
      return;
    }

    switch (window.location.pathname) {
      case "/":
        app.pageContent = html`<app-landing-page></app-landing-page>`;
        break;
      case "/docs/frontend":
      case "/docs/backend":
        app.pageContent = html`<docs-page></docs-page>`;
        break;
      case "/support":
        app.pageContent = html`<support-page></support-page>`;
        break;
      case "/dashboard":
        app.pageContent = html`<dashboard-page></dashboard-page>`;
        break;
      case "/settings":
        app.pageContent = html`<settings-page></settings-page>`;
        break;
      case "/profile":
        app.pageContent = html`<profile-page></profile-page>`;
        break;
      case "/community":
        app.pageContent = html`<community-page></community-page>`;
        break;
      case "/projects":
        app.pageContent = html`<projects-page></projects-page>`;
        break;
      default:
        app.pageContent = html`
          <div
            style="
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-color);
          "
          >
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a
              href="/"
              style="
              display: inline-block;
              margin-top: 1rem;
              padding: 0.75rem 1.5rem;
              background: var(--primary-color);
              color: white;
              text-decoration: none;
              border-radius: 4px;
            "
              >Return Home</a
            >
          </div>
        `;
    }
    if (app.requestUpdate) {
      app.requestUpdate();
    }
  },
};

// Initialize router
router.init();

// Create error boundary component
class ErrorPage extends HTMLElement {
  static tagName = "error-page";

  set error(err) {
    Logger.error("Rendering error page", err);
    this.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #ef4444;">Error Loading Page</h1>
        <p style="color: #6b7280;">${err.message}</p>
        <button onclick="window.location.href='/'">Return Home</button>
      </div>
    `;
  }
}
customElements.define(ErrorPage.tagName, ErrorPage);

// Initialize app
async function initializeApp() {
  try {
    // Wait for custom elements
    await waitForCustomElements();

    // Handle initial route
    await router.handleRoute();

    // Listen for navigation events
    window.addEventListener("navigation", (e) => {
      router.handleRoute();
    });

    // Register service worker
    if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.register(
          "/src/service-worker.js"
        );
        Logger.info("ServiceWorker registration successful", registration);
      } else {
        console.log("Development mode: skipping service worker registration");
      }
    }

    // Add any additional initialization logic here
    Logger.info("App initialized successfully");
  } catch (error) {
    Logger.error("Failed to initialize app", error);
    throw error;
  }
}

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// PWA installation prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  Logger.info("Install prompt deferred");

  // Show install button or prompt
  const installButton = document.createElement("button");
  installButton.textContent = "Install App";
  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    Logger.info("Install prompt shown");
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    Logger.info(`User ${outcome} the install prompt`);
    deferredPrompt = null;
  });
});

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

// Initialize theme from localStorage or system preference
const savedTheme = localStorage.getItem("neo-theme") || "system";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
const initialTheme = savedTheme === "system" ? systemTheme : savedTheme;

document.documentElement.setAttribute("data-theme", initialTheme);
