// Main application router - VANILLA JAVASCRIPT VERSION
import './components/pages/auth/login-page.js';
import './components/pages/auth/register-page.js';
import './components/pages/dashboard-page.js';
import './pages/developer-page.js';

class Router {
  constructor() {
    this._routes = new Map([
      ["/", { component: "home-page", title: "Home" }],
      ["/register", { component: "register-page", title: "Register" }],
      ["/auth/register", { component: "register-page", title: "Register" }],
      ["/login", { component: "login-page", title: "Login" }],
      ["/dashboard", { component: "dashboard-page", title: "Dashboard" }],
      ["/docs", { component: "docs-page", title: "Documentation" }],
      ["/developers", { component: "developer-page", title: "Developer Experience" }],
      ["/api", { component: "developer-page", title: "API Documentation" }],
      ["/playground", { component: "developer-page", title: "API Playground" }],
    ]);
    this._initialized = false;
    this._mainContent = null;
  }

  // Manual initialization - call this after neo-app component is rendered
  initialize() {
    if (this._initialized) return;

    console.log("Router main initialization starting...");

    this._mainContent = document.querySelector("#router-outlet");

    if (!this._mainContent) {
      console.error("Router outlet not found during main initialization!");
      return;
    }

    console.log("Router initialized, outlet found:", this._mainContent);

    // Listen for navigation
    window.addEventListener("popstate", () => this.handleRoute());
    window.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        this.navigate(new URL(link.href).pathname);
      }
    });

    this._initialized = true;
    this.handleRoute(); // Handle initial route
  }

  async handleRoute() {
    const path = window.location.pathname;
    const route = this._routes.get(path);

    console.log("Handling route:", path, route);

    if (!route) {
      console.log("Route not found, showing 404");
      this._render404();
      return;
    }

    try {
      // Clear existing content
      this._mainContent.innerHTML = "";

      // Create component element
      const element = document.createElement(route.component);

      // Append the component to the DOM
      this._mainContent.appendChild(element);

      // Update title
      document.title = `${route.title} - NeoForge`;

      console.log("Route rendered successfully");

    } catch (error) {
      console.error("Error loading route:", error);
      this._render404();
    }
  }

  _render404() {
    // Create a simple 404 component using our atomic design
    const notFoundCard = document.createElement('neo-card');
    notFoundCard.setAttribute('shadow', 'medium');
    notFoundCard.setAttribute('padding', 'large');
    notFoundCard.style.cssText = `
      max-width: 400px;
      margin: 2rem auto;
      text-align: center;
    `;

    notFoundCard.innerHTML = `
      <h2 style="color: #1f2937; margin-bottom: 1rem;">Page Not Found</h2>
      <p style="color: #6b7280; margin-bottom: 2rem;">The requested page could not be found.</p>
      <neo-button variant="primary" onclick="window.location.href='/'">
        Go Home
      </neo-button>
    `;

    this._mainContent.innerHTML = "";
    this._mainContent.appendChild(notFoundCard);
    document.title = "Page Not Found - NeoForge";
  }

  navigate(path) {
    window.history.pushState(null, "", path);
    return this.handleRoute();
  }
}

// Create and export router instance
export const router = new Router();