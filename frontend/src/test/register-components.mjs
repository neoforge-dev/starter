import { LitElement, html } from "lit";
import { BaseComponent } from "../components/base-component.js";
import { ErrorPage } from "../components/error/error-page.js";
import { LoginForm } from "../components/auth/login-form.js";
import { LoginPage } from "../components/pages/login-page.js";

// Import and register components
const components = [
  ["dashboard-page", () => import("../pages/dashboard-page.js")],
  ["login-form", LoginForm],
  ["login-page", LoginPage],
  ["error-page", ErrorPage],
  ["support-page", () => import("../pages/support-page.js")],
  ["contact-page", () => import("../pages/contact-page.js")],
  ["profile-page", () => import("../pages/profile-page.js")],
  ["about-page", () => import("../pages/about-page.js")],
  ["faq-page", () => import("../pages/faq-page.js")],
  ["status-page", () => import("../pages/status-page.js")],
  ["tutorials-page", () => import("../pages/tutorials-page.js")],
  ["settings-page", () => import("../pages/settings-page.js")],
  ["blog-page", () => import("../pages/blog-page.js")],
  ["neo-table", () => import("../components/organisms/table/table.js")]
];

// Function to register a single component
async function registerComponent(name, component) {
  try {
    let ComponentClass;

    if (typeof component === "function") {
      if (component.constructor && component.constructor.name === "AsyncFunction" ||
          component.toString().includes('import(')) {
        // If component is a dynamic import, wait for it to load
        try {
          const module = await component();
          // Try different ways to get the component class
          ComponentClass =
            module.default ||
            module[name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")] ||
            module[name.charAt(0).toUpperCase() + name.slice(1)];
        } catch (error) {
          console.error(`Failed to load component module for ${name}:`, error);
          return;
        }
      } else {
        // If component is a regular class/function
        ComponentClass = component;
      }
    }

    if (!ComponentClass || typeof ComponentClass !== 'function') {
      console.warn(`Could not find component class for ${name}, using placeholder`);
      // Create a placeholder component for testing if needed
      ComponentClass = class PlaceholderComponent extends LitElement {
        render() { return html``; }
      };
    }

    // Register the component
    await BaseComponent.registerComponent(name, ComponentClass);
  } catch (error) {
    console.error(`Failed to register component ${name}:`, error);
  }
}

// Function to register all components
async function registerAllComponents() {
  for (const [name, component] of components) {
    await registerComponent(name, component);
  }
}

// Export functions
export {
  registerComponent,
  registerAllComponents,
  components
};
