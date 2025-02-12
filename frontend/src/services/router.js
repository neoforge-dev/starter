import { authGuard } from "../config/routes.js";

class Router {
  constructor() {
    this.routes = new Map();
    this._handlePopState = this._handlePopState.bind(this);
    window.addEventListener("popstate", this._handlePopState);
  }

  addRoute(path, component) {
    this.routes.set(path, component);
  }

  async navigate(path, data = {}) {
    // Check if route exists
    if (!this.routes.has(path)) {
      path = "/404";
    }

    // Check auth requirements
    if (!authGuard(path)) {
      return;
    }

    // Handle external URLs
    if (typeof this.routes.get(path) === "function") {
      this.routes.get(path)();
      return;
    }

    window.history.pushState(data, "", path);
    await this._loadComponent(path);
  }

  async _handlePopState() {
    const path = window.location.pathname;
    if (!authGuard(path)) {
      return;
    }
    await this._loadComponent(path);
  }

  async _loadComponent(path) {
    const component = this.routes.get(path) || this.routes.get("/404");

    // Clear main content
    const main = document.querySelector("main");
    if (main) {
      main.innerHTML = "";

      // Create and mount new component
      const element = document.createElement(component);

      // Pass route params if any
      const params = new URLSearchParams(window.location.search);
      params.forEach((value, key) => {
        element.setAttribute(key, value);
      });

      main.appendChild(element);

      // Dispatch route change event
      window.dispatchEvent(
        new CustomEvent("route-changed", {
          detail: {
            path,
            component,
            params: Object.fromEntries(params),
          },
        })
      );
    }
  }

  init() {
    this._loadComponent(window.location.pathname);
  }
}

export const router = new Router();
