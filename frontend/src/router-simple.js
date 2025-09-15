// Simplified router for debugging - minimal dependencies
import { LitElement, html } from "lit";

class Router {
  constructor() {
    this._routes = new Map([
      ["/", { component: "home-page", title: "Home" }],
      ["/register", { component: "registration-page", title: "Register" }],
      ["/auth/register", { component: "registration-page", title: "Register" }],
    ]);
    this._initialized = false;
    this._mainContent = null;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._initialize());
    } else {
      this._initialize();
    }
  }

  _initialize() {
    if (this._initialized) return;

    // Find router outlet
    this._mainContent = document.querySelector("#router-outlet");

    if (!this._mainContent) {
      console.error("Router outlet not found!");
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

      // Render content based on route
      if (route.component === 'registration-page') {
        element.innerHTML = `
          <div style="max-width: 400px; margin: 2rem auto; padding: 2rem; border: 1px solid #ddd; border-radius: 8px;">
            <h2>Registration Page</h2>
            <form>
              <div style="margin-bottom: 1rem;">
                <label for="name" style="display: block; margin-bottom: 0.5rem;">Name:</label>
                <input type="text" id="name" data-testid="name-input" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label for="email" style="display: block; margin-bottom: 0.5rem;">Email:</label>
                <input type="email" id="email" data-testid="email-input" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label for="password" style="display: block; margin-bottom: 0.5rem;">Password:</label>
                <input type="password" id="password" data-testid="password-input" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 1rem;">
                <label for="confirm-password" style="display: block; margin-bottom: 0.5rem;">Confirm Password:</label>
                <input type="password" id="confirm-password" data-testid="confirm-password-input" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <button type="submit" data-testid="register-button" style="width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Register</button>
            </form>
          </div>
        `;
      } else {
        element.innerHTML = `<div style="text-align: center; padding: 2rem;"><h2>${route.title}</h2><p>This is a simplified version for debugging.</p></div>`;
      }

      this._mainContent.appendChild(element);

      // Update title
      document.title = `${route.title} - NeoForge`;

      console.log("Route rendered successfully");

    } catch (error) {
      console.error("Error loading route:", error);
    }
  }

  _render404() {
    this._mainContent.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>Page Not Found</h2>
        <p>The requested page could not be found.</p>
        <a href="/" style="color: #2563eb; text-decoration: none;">Go Home</a>
      </div>
    `;
  }

  navigate(path) {
    window.history.pushState(null, "", path);
    return this.handleRoute();
  }
}

// Create and export router instance
export const router = new Router();