import { authService } from "./services/auth.ts";
import { tenantService } from "./services/tenant.js";
import { lazyLoad } from "./utils/lazy-load.js";

// Route definitions with metadata
const routes = [
  // Public routes
  {
    path: "/",
    component: "landing-page",
    import: () =>
      lazyLoad("./pages/landing-page.js", "landing-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading homepage...</div>',
      }),
    public: true,
  },
  {
    path: "/docs",
    component: "docs-page",
    import: () =>
      lazyLoad("./pages/docs-page.js", "docs-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading documentation...</div>',
      }),
    public: true,
  },
  {
    path: "/examples",
    component: "examples-page",
    import: () =>
      lazyLoad("./pages/examples-page.js", "examples-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading examples...</div>',
      }),
    public: true,
  },
  {
    path: "/blog",
    component: "blog-page",
    import: () =>
      lazyLoad("./pages/blog-page.js", "blog-page", {
        fallback: () => '<div class="loading-fallback">Loading blog...</div>',
      }),
    public: true,
  },
  {
    path: "/community",
    component: "community-page",
    import: () =>
      lazyLoad("./pages/community-page.js", "community-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading community page...</div>',
      }),
    public: true,
  },
  {
    path: "/projects",
    component: "projects-page",
    import: () =>
      lazyLoad("./pages/projects-page.js", "projects-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading projects page...</div>',
      }),
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
    component: "login-page",
    import: () =>
      lazyLoad("./pages/auth/login-page.js", "login-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading login page...</div>',
      }),
    public: true,
    guestOnly: true,
  },
  {
    path: "/auth/register",
    component: "register-page",
    import: () =>
      lazyLoad("./pages/auth/register-page.js", "register-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading registration...</div>',
      }),
    public: true,
    guestOnly: true,
  },
  // Protected routes
  {
    path: "/dashboard",
    component: "dashboard-page",
    import: () =>
      lazyLoad("./pages/dashboard-page.js", "dashboard-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading dashboard...</div>',
      }),
    public: false,
  },
  {
    path: "/profile",
    component: "profile-page",
    import: () =>
      lazyLoad("./pages/profile-page.js", "profile-page", {
        fallback: () =>
          '<div class="loading-fallback">Loading profile...</div>',
      }),
    public: false,
  },
   {
     path: "/settings",
     component: "settings-page",
     import: () =>
       lazyLoad("./pages/settings-page.js", "settings-page", {
         fallback: () =>
           '<div class="loading-fallback">Loading settings...</div>',
       }),
     public: false,
   },
   {
     path: "/tenant",
     component: "tenant-management",
     import: () =>
       lazyLoad("./components/tenant/tenant-management.js", "tenant-management", {
         fallback: () =>
           '<div class="loading-fallback">Loading tenant management...</div>',
       }),
     public: false,
     tenantAware: true,
   },
   {
     path: "/tenant/settings",
     component: "tenant-management",
     import: () =>
       lazyLoad("./components/tenant/tenant-management.js", "tenant-management", {
         fallback: () =>
           '<div class="loading-fallback">Loading tenant settings...</div>',
       }),
     public: false,
     tenantAware: true,
   },
];

class Router {
  constructor() {
    this._routes = new Map(routes.map((route) => [route.path, route]));
    // Prefer dedicated router outlet if present, otherwise fallback to <main>
    this._mainContent = document.querySelector("#router-outlet") || document.querySelector("main");

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
      component: "not-found-page",
      import: () =>
        lazyLoad("./pages/not-found-page.js", "not-found-page", {
          fallback: () => '<div class="loading-fallback">Page not found</div>',
        }),
      public: true,
    };

    // Auth checks
    const isAuthenticated = authService.isAuthenticated;

    if (!route.public && !isAuthenticated) {
      this.navigate("/auth/login");
      return;
    }

    if (route.guestOnly && isAuthenticated) {
      this.navigate("/dashboard");
      return;
    }

    // Tenant-specific routing checks
    if (this._shouldApplyTenantRouting(route)) {
      await this._handleTenantRouting(route, path);
      return;
    }

    try {
      // Clear existing content
      this._mainContent.innerHTML = "";

      // Create error boundary
      const errorBoundary = document.createElement("error-boundary");
      this._mainContent.appendChild(errorBoundary);

      // Create and mount new component inside error boundary
      const element = document.createElement(route.component);

      // Apply tenant context to component if available
      const currentTenant = tenantService.getTenant();
      if (currentTenant && currentTenant.id !== 'default') {
        element.setAttribute('data-tenant', currentTenant.slug);
        element.setAttribute('data-tenant-id', currentTenant.id);
      }

      errorBoundary.appendChild(element);

      // Load component
      await route.import();

      // Update title and meta
      document.title = `${this._getTitle(path)} - ${this._getTenantTitleSuffix()}`;
      this._updateMeta(route);

      // Scroll to top
      window.scrollTo(0, 0);

      // Analytics
      this._trackPageView(path);
    } catch (error) {
      console.error("Error loading page:", error);
      // Error will be handled by error boundary
    }
  }

  _shouldApplyTenantRouting(route) {
    // Apply tenant routing for tenant-specific pages
    return route.tenantAware || route.path?.includes('/tenant');
  }

  async _handleTenantRouting(route, path) {
    const currentTenant = tenantService.getTenant();

    // Redirect to tenant-specific dashboard if on default tenant
    if (currentTenant.id === 'default' && route.path === '/dashboard') {
      // Could redirect to tenant selection or default tenant dashboard
      return;
    }

    // Handle tenant-specific routes
    if (route.tenantRoute) {
      const tenantPath = route.tenantRoute(currentTenant);
      if (tenantPath !== path) {
        this.navigate(tenantPath);
        return;
      }
    }

    // Continue with normal routing
    await this._loadRoute(route, path);
  }

  async _loadRoute(route, path) {
    try {
      // Clear existing content
      this._mainContent.innerHTML = "";

      // Create error boundary
      const errorBoundary = document.createElement("error-boundary");
      this._mainContent.appendChild(errorBoundary);

      // Create and mount new component inside error boundary
      const element = document.createElement(route.component);

      // Apply tenant context
      const currentTenant = tenantService.getTenant();
      if (currentTenant && currentTenant.id !== 'default') {
        element.setAttribute('data-tenant', currentTenant.slug);
        element.setAttribute('data-tenant-id', currentTenant.id);
      }

      errorBoundary.appendChild(element);

      // Load component
      await route.import();

      // Update title and meta
      document.title = `${this._getTitle(path)} - ${this._getTenantTitleSuffix()}`;
      this._updateMeta(route);

      // Scroll to top
      window.scrollTo(0, 0);

      // Analytics
      this._trackPageView(path);
    } catch (error) {
      console.error("Error loading route:", error);
    }
  }

  _getTenantTitleSuffix() {
    const tenant = tenantService.getTenant();
    if (tenant && tenant.id !== 'default') {
      return `${tenant.name} - NeoForge`;
    }
    return 'NeoForge';
  }

  navigate(path) {
    window.history.pushState(null, "", path);
    return this.handleRoute();
  }

  _getTitle(path) {
    return path === "/"
      ? "Home"
      : path
          .split("/")
          .pop()
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
  }

  _updateMeta(route) {
    // Update meta tags based on route metadata
    const description =
      route.description || "NeoForge - Modern Web Components Framework";
    const keywords = route.keywords || "web components, frontend, framework";

    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[name="keywords"]').content = keywords;
  }

  _trackPageView(path) {
    // Simple analytics tracking
    if (window.gtag) {
      window.gtag("config", "GA-TRACKING-ID", {
        page_path: path,
      });
    }
  }
}

export const router = new Router();
