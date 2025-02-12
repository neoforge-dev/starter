import { authService } from "./services/auth-service.js";

// Route definitions
const routes = [
  // Public routes
  {
    path: "/",
    component: () => import("./pages/home-page.js"),
    public: true,
  },
  {
    path: "/docs",
    component: () => import("./pages/docs-page.js"),
    public: true,
  },
  {
    path: "/components",
    component: () => import("./pages/components-page.js"),
    public: true,
  },
  {
    path: "/examples",
    component: () => import("./pages/examples-page.js"),
    public: true,
  },
  {
    path: "/blog",
    component: () => import("./pages/blog-page.js"),
    public: true,
  },
  {
    path: "/community",
    component: () => import("./pages/community-page.js"),
    public: true,
  },
  {
    path: "/projects",
    component: () => import("./pages/projects-page.js"),
    public: true,
  },
  {
    path: "/support",
    component: () => import("./pages/support-page.js"),
    public: true,
  },

  // Auth routes (guest only)
  {
    path: "/auth/login",
    component: () => import("./pages/auth/login-page.js"),
    public: true,
    guestOnly: true,
  },
  {
    path: "/auth/register",
    component: () => import("./pages/auth/register-page.js"),
    public: true,
    guestOnly: true,
  },

  // Protected routes (require authentication)
  {
    path: "/dashboard",
    component: () => import("./pages/dashboard-page.js"),
    public: false,
  },
  {
    path: "/profile",
    component: () => import("./pages/profile-page.js"),
    public: false,
  },
  {
    path: "/settings",
    component: () => import("./pages/settings-page.js"),
    public: false,
  },
];

class Router {
  constructor() {
    this._routes = new Map(routes.map((route) => [route.path, route]));

    this._mainContent = document.querySelector("main");

    window.addEventListener("popstate", () => this.handleRoute());
    window.addEventListener("DOMContentLoaded", () => this.handleRoute());

    // Handle clicks on links
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        this.navigate(new URL(link.href).pathname);
      }
    });
  }

  async handleRoute() {
    const path = window.location.pathname;
    const route = this._routes.get(path) || {
      component: () => import("./pages/not-found-page.js"),
      public: true,
    };

    // Auth checks
    const isAuthenticated = authService.isAuthenticated;

    if (!route.public && !isAuthenticated) {
      // Redirect to login if trying to access protected route
      this.navigate("/auth/login");
      return;
    }

    if (route.guestOnly && isAuthenticated) {
      // Redirect to dashboard if trying to access guest-only route while logged in
      this.navigate("/dashboard");
      return;
    }

    try {
      // Load component
      const module = await route.component();
      const tagName =
        Object.values(module)[0].tagName || this._getTagName(path);

      if (!customElements.get(tagName)) {
        // Wait for component to be defined if it's not already
        await customElements.whenDefined(tagName);
      }

      // Update content
      this._mainContent.innerHTML = `<${tagName}></${tagName}>`;

      // Update title
      document.title = `${this._getTitle(path)} - NeoForge`;

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error loading page:", error);
      this._mainContent.innerHTML = `
        <div class="error-page">
          <h1>Error Loading Page</h1>
          <p>${error.message}</p>
          <button onclick="window.location.href='/'">Return Home</button>
        </div>
      `;
    }
  }

  navigate(path) {
    window.history.pushState({}, "", path);
    this.handleRoute();
  }

  _getTagName(path) {
    // Convert path to tag name (e.g., /auth/login -> login-page)
    const basename = path.split("/").pop() || "home";
    return `${basename}-page`;
  }

  _getTitle(path) {
    // Convert path to title (e.g., /auth/login -> Login)
    const basename = path.split("/").pop() || "Home";
    return basename.charAt(0).toUpperCase() + basename.slice(1);
  }
}

export const router = new Router();
