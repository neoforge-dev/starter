import { router } from "../services/router.js";

// Page components
const routes = {
  // Public routes
  "/": "landing-page",
  "/docs": "docs-page",
  "/examples": "examples-page",
  "/tutorials": "tutorials-page",
  "/faq": "faq-page",
  "/contact": "contact-page",
  "/status": "status-page",

  // Auth routes
  "/auth/login": "login-page",
  "/auth/register": "signup-page",
  "/verify-email": "verify-email-page",
  "/forgot-password": "forgot-password-page",
  "/reset-password": "reset-password-page",

  // Protected routes (require auth)
  "/dashboard": "dashboard-page",
  "/profile": "profile-page",
  "/settings": "settings-page",

  // External routes (handled differently)
  "/github": "https://github.com/neoforge/neoforge",
  "/discord": "https://discord.gg/neoforge",
  "/twitter": "https://twitter.com/neoforge",

  // Error routes
  "/404": "not-found-page",
};

// Initialize routes
export function initializeRoutes() {
  Object.entries(routes).forEach(([path, component]) => {
    // Handle external URLs
    if (component.startsWith("http")) {
      router.addRoute(path, () => {
        window.location.href = component;
      });
    } else {
      router.addRoute(path, component);
    }
  });
}

// Auth guard middleware
export function authGuard(path) {
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];
  if (protectedRoutes.includes(path)) {
    const isAuthenticated = localStorage.getItem("auth_token");
    if (!isAuthenticated) {
      router.navigate("/auth/login", {
        redirect: path,
      });
      return false;
    }
  }
  return true;
}

// Export route names for consistency
export const ROUTES = {
  HOME: "/",
  DOCS: "/docs",
  EXAMPLES: "/examples",
  TUTORIALS: "/tutorials",
  FAQ: "/faq",
  CONTACT: "/contact",
  STATUS: "/status",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  NOT_FOUND: "/404",
};
